import { getPackConfig } from "@fabkit/apps/pack-opener/pack/odds";
import { SET_SOURCE_URLS } from "@fabkit/apps/pack-opener/pack/set-configs";
import type {
	PackSlotKind,
	RarityWeight,
} from "@fabkit/apps/pack-opener/pack/types";
import { CardRarities } from "@fabkit/shared/config/cards/rarities";
import {
	Dialog,
	DialogBackdrop,
	DialogPanel,
	DialogTitle,
} from "@headlessui/react";
import { ExternalLink, X } from "lucide-react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

export interface SetInfoDialogProps {
	open: boolean;
	onClose: () => void;
	setCode: string;
	setName: string;
}

/** Deduped, translated rarity names a slot can land on — expansion-slot
 * and class/generic distinctions are already carried by the slot's own
 * label (see SLOT_LABEL_KEYS below), so this only needs the rarity list
 * itself, not the engine's internal weighting. */
function rarityNames(
	table: RarityWeight[],
	t: (key: string) => string,
): string {
	const seen = new Set<string>();
	const names: string[] = [];
	for (const entry of table) {
		if (seen.has(entry.rarity)) continue;
		seen.add(entry.rarity);
		names.push(t(CardRarities[entry.rarity].label));
	}
	return names.join(" / ");
}

const SLOT_LABEL_KEYS: Record<PackSlotKind, string> = {
	common: "dialog.slot.common",
	"guaranteed-rare-plus": "dialog.slot.guaranteed-rare-plus",
	"premium-foil": "dialog.slot.premium-foil",
	"basic-or-token": "dialog.slot.basic-or-token",
	rare: "dialog.slot.rare",
	"rare-or-majestic": "dialog.slot.rare-or-majestic",
	"rare-or-super-rare-plus": "dialog.slot.rare-or-super-rare-plus",
	token: "dialog.slot.token",
	"token-or-wildcard": "dialog.slot.token-or-wildcard",
	basic: "dialog.slot.basic",
	"basic-or-wildcard": "dialog.slot.basic-or-wildcard",
	"generic-common": "dialog.slot.generic-common",
	"class-common": "dialog.slot.class-common",
	equipment: "dialog.slot.equipment",
};

/** Reuses the Headless UI Dialog pattern from
 * src/apps/fabble/components/RulesDialog.tsx. Pack contents and pull
 * rates are derived live from the set's own PackConfig (pack/odds.ts),
 * not a separately-authored copy of fabtcg.com's wording — that keeps the
 * dialog impossible to drift out of sync with the actual odds engine.
 * Prices are deliberately not shown here yet — no price data exists
 * until the snapshot pipeline lands (see the execution plan's commit 10). */
export function SetInfoDialog({
	open,
	onClose,
	setCode,
	setName,
}: SetInfoDialogProps) {
	const { t } = useTranslation("pack-opener");
	const closeButtonRef = useRef<HTMLButtonElement>(null);

	const config = getPackConfig(setCode);
	const sourceUrl = SET_SOURCE_URLS[setCode];

	return (
		<Dialog
			open={open}
			onClose={onClose}
			initialFocus={closeButtonRef}
			className="relative z-50"
		>
			<DialogBackdrop className="fixed inset-0 bg-black/30" />
			<div className="fixed inset-0 flex w-screen items-center justify-center p-4">
				<DialogPanel className="max-h-[85vh] w-full max-w-105 overflow-y-auto space-y-5 rounded-lg border border-border-primary bg-surface p-6 shadow-xl">
					<div className="flex items-start justify-between gap-4">
						<DialogTitle className="text-lg font-bold text-heading">
							{setName}
						</DialogTitle>
						<button
							type="button"
							onClick={onClose}
							aria-label={t("common.close")}
							className="shrink-0 rounded-full p-1 text-muted transition-colors hover:text-heading"
						>
							<X className="h-5 w-5" />
						</button>
					</div>

					<section className="space-y-1">
						<h3 className="font-semibold text-body">
							{t("dialog.cards_per_pack_title")}
						</h3>
						<p className="text-sm text-muted">{config.cardsPerPack}</p>
					</section>

					<section className="space-y-2">
						<h3 className="font-semibold text-body">
							{t("dialog.pack_contents_title")}
						</h3>
						<ul className="space-y-1.5 text-sm">
							{config.slots.map((slot, index) => (
								<li
									// biome-ignore lint/suspicious/noArrayIndexKey: slots have no stable id and never reorder within a render
									key={index}
									className="flex flex-col"
								>
									<span className="text-body">
										{slot.count} × {t(SLOT_LABEL_KEYS[slot.kind])}
									</span>
									<span className="text-xs text-subtle">
										{rarityNames(slot.rarityTable, t)}
										{slot.fixedTreatment && slot.fixedTreatment !== "standard"
											? ` — ${t(`dialog.treatment.${slot.fixedTreatment}`)}`
											: ""}
									</span>
								</li>
							))}
						</ul>
						{config.coldFoilChance > 0 && (
							<p className="text-xs text-subtle">
								{t("dialog.cold_foil_note", {
									odds: Math.round(1 / config.coldFoilChance),
								})}
							</p>
						)}
					</section>

					{sourceUrl && (
						<a
							href={sourceUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-heading"
						>
							<ExternalLink className="h-3.5 w-3.5 shrink-0" />
							{t("dialog.source_link")}
						</a>
					)}

					<button
						ref={closeButtonRef}
						type="button"
						onClick={onClose}
						className="w-full rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
					>
						{t("common.close")}
					</button>
				</DialogPanel>
			</div>
		</Dialog>
	);
}
