import { formatUsd } from "@fabkit/apps/pack-opener/lib/currency";
import { getPackConfig } from "@fabkit/apps/pack-opener/pack/odds";
import {
	PERCENT_DISPLAY_THRESHOLD,
	percentOfPack,
	pullRateRows,
} from "@fabkit/apps/pack-opener/pack/pull-rates";
import { SET_SOURCE_URLS } from "@fabkit/apps/pack-opener/pack/set-configs";
import type {
	PackSlotKind,
	RarityWeight,
} from "@fabkit/apps/pack-opener/pack/types";
import { CardRarities } from "@fabkit/shared/config/cards/rarities";
import { getSetPrices } from "@fabkit/shared/data/fab-prices";
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
 * src/apps/fabble/components/RulesDialog.tsx. Pull rates and pack contents
 * are both derived live from the set's own PackConfig (pack/odds.ts),
 * not a separately-authored copy of fabtcg.com's wording — that keeps the
 * dialog impossible to drift out of sync with the actual odds engine. The
 * pull-rate percentages (pullRateRows above) reuse the same
 * expectedRarityCounts SessionStatsDialog.tsx compares actual pulls
 * against, so a player can never see two different numbers claiming to be
 * the same rate. Many of those weights are themselves LSS-published-slot-
 * membership-times-population approximations rather than a confirmed
 * per-rarity split (see pack/set-configs.ts's own extensive comments) —
 * dialog.rate_disclaimer says so in the UI rather than presenting an
 * approximation as a confirmed number. Order asked for by the product
 * owner: rates, then pack contents, then current prices. Prices come from
 * the build-time snapshot (see shared/data/fab-prices.ts) and show a
 * neutral placeholder rather than nothing when unavailable — a set the
 * build script never resolved a tcgcsv group for, or whose snapshot hasn't
 * loaded yet. */
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
	const rates = pullRateRows(config);
	const prices = getSetPrices(setCode);
	const capturedDate = prices
		? new Date(prices.capturedAt).toLocaleDateString(undefined, {
				year: "numeric",
				month: "short",
				day: "numeric",
			})
		: null;

	return (
		<Dialog
			open={open}
			onClose={onClose}
			initialFocus={closeButtonRef}
			className="relative z-50"
		>
			<DialogBackdrop className="fixed inset-0 bg-black/30" />
			<div className="fixed inset-0 flex w-screen items-center justify-center p-4 lg:pl-72">
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
							{t("dialog.pull_rates_title")}
						</h3>
						<ul className="space-y-1.5 text-sm">
							{rates.map((row) => {
								const percent = percentOfPack(row, config);
								return (
									<li key={row.rarity} className="flex items-center gap-2">
										<img
											src={CardRarities[row.rarity].icon}
											alt=""
											className="h-4 w-4 shrink-0"
										/>
										<span className="flex-1 text-body">
											{t(CardRarities[row.rarity].label)}
										</span>
										<span className="font-card-stat shrink-0 text-xs text-subtle">
											{percent >= PERCENT_DISPLAY_THRESHOLD
												? `${percent.toFixed(1)}%`
												: t("dialog.rate_odds", {
														odds: Math.round(1 / row.expectedPerPack),
													})}
										</span>
									</li>
								);
							})}
						</ul>
						{config.coldFoilChance > 0 && (
							<p className="text-xs text-subtle">
								{t("dialog.cold_foil_note", {
									odds: Math.round(1 / config.coldFoilChance),
								})}
							</p>
						)}
						<p className="text-xs text-subtle">{t("dialog.rate_disclaimer")}</p>
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
					</section>

					<section className="space-y-1.5">
						<h3 className="font-semibold text-body">
							{t("dialog.price_title")}
						</h3>
						<div className="flex items-center justify-between text-sm">
							<span className="text-muted">{t("dialog.pack_price_label")}</span>
							<span className="font-card-stat text-body">
								{prices?.packMarketPrice != null
									? formatUsd(prices.packMarketPrice)
									: t("page.price_unavailable")}
							</span>
						</div>
						<div className="flex items-center justify-between text-sm">
							<span className="text-muted">{t("dialog.box_price_label")}</span>
							<span className="font-card-stat text-body">
								{prices?.boxMarketPrice != null
									? formatUsd(prices.boxMarketPrice)
									: t("page.price_unavailable")}
							</span>
						</div>
						{capturedDate && (
							<p className="text-xs text-subtle">
								{t("dialog.price_captured", { date: capturedDate })}
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
