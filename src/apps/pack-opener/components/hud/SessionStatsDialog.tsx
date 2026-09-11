import { activeCardResolver } from "@fabkit/apps/pack-opener/cards/card-resolver";
import type { Currency } from "@fabkit/apps/pack-opener/lib/currency";
import { formatMoney } from "@fabkit/apps/pack-opener/lib/currency";
import { cardPrice, packPrice } from "@fabkit/apps/pack-opener/lib/pricing";
import { getPackConfig } from "@fabkit/apps/pack-opener/pack/odds";
import type { OpenedPackRecord } from "@fabkit/apps/pack-opener/stats/session-stats";
import { computeSessionStats } from "@fabkit/apps/pack-opener/stats/session-stats";
import { usePackOpenerStore } from "@fabkit/apps/pack-opener/stores/pack-opener";
import { CardRarities } from "@fabkit/shared/config/cards/rarities";
import { getSetIndex } from "@fabkit/shared/data/fab-printings";
import {
	Dialog,
	DialogBackdrop,
	DialogPanel,
	DialogTitle,
} from "@headlessui/react";
import { X } from "lucide-react";
import { useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";

export interface SessionStatsDialogProps {
	open: boolean;
	onClose: () => void;
	openedPacks: OpenedPackRecord[];
}

/** Totals value pulled and value spent across the whole session, resolving
 * each drawn card to its printing (same activeCardResolver + lib/pricing
 * pattern PackSummary.tsx uses per pack) rather than folding this into the
 * pure stats module — see session-stats.ts's own doc comment on why price
 * lookups stay in the component. Null when nothing at all is priced yet;
 * "partial" when some but not all of what should be summed is known,
 * mirroring PackSummary.tsx's own partial-total handling. */
function computeValueTotals(
	openedPacks: OpenedPackRecord[],
	currency: Currency,
) {
	let pulledValue = 0;
	let knownCardCount = 0;
	let totalCardCount = 0;
	let spent = 0;
	let knownPackCount = 0;

	for (const record of openedPacks) {
		totalCardCount += record.cards.length;
		for (const card of record.cards) {
			const resolved = activeCardResolver.resolve(card, record.setCode);
			const price = cardPrice(currency, record.setCode, resolved);
			if (price !== null) {
				pulledValue += price;
				knownCardCount += 1;
			}
		}
		const sealedPrice = packPrice(currency, record.setCode);
		if (sealedPrice !== null) {
			spent += sealedPrice;
			knownPackCount += 1;
		}
	}

	return {
		pulledValue: knownCardCount > 0 ? pulledValue : null,
		spent: knownPackCount > 0 ? spent : null,
		isPartial:
			(knownCardCount > 0 && knownCardCount < totalCardCount) ||
			(knownPackCount > 0 && knownPackCount < openedPacks.length),
	};
}

/** Second dialog on the summary screen, reusing the same Headless UI
 * pattern as SetInfoDialog.tsx. Current-session only — see the execution
 * plan, section 4.5: aggregation lives in the pure computeSessionStats
 * (stats/session-stats.ts), fed by the store's flat openedPacksThisSession
 * list, so promoting this to persistent history later only means changing
 * where that list comes from. */
export function SessionStatsDialog({
	open,
	onClose,
	openedPacks,
}: SessionStatsDialogProps) {
	const { t } = useTranslation("pack-opener");
	const closeButtonRef = useRef<HTMLButtonElement>(null);
	const currency = usePackOpenerStore((state) => state.currency);

	const stats = useMemo(
		() => computeSessionStats(openedPacks, getPackConfig),
		[openedPacks],
	);
	const valueTotals = useMemo(
		() => computeValueTotals(openedPacks, currency),
		[openedPacks, currency],
	);
	const setNames = useMemo(() => {
		const names = new Map<string, string>();
		for (const entry of getSetIndex()) names.set(entry.code, entry.name);
		return names;
	}, []);

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
							{t("stats.title")}
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

					{stats.totalPacksOpened === 0 ? (
						<p className="text-sm text-muted">{t("stats.empty")}</p>
					) : (
						<>
							<section className="space-y-1">
								<h3 className="font-semibold text-body">
									{t("stats.packs_opened_label")}
								</h3>
								<p className="text-sm text-muted">{stats.totalPacksOpened}</p>
							</section>

							<section className="space-y-1.5">
								<h3 className="font-semibold text-body">
									{t("stats.value_title")}
								</h3>
								<div className="flex items-center justify-between text-sm">
									<span className="text-muted">
										{t("page.value_pulled_label")}
									</span>
									<span className="font-card-stat text-body">
										{valueTotals.pulledValue !== null
											? formatMoney(valueTotals.pulledValue, currency)
											: t("page.price_unavailable")}
									</span>
								</div>
								<div className="flex items-center justify-between text-sm">
									<span className="text-muted">{t("stats.spent_label")}</span>
									<span className="font-card-stat text-body">
										{valueTotals.spent !== null
											? formatMoney(valueTotals.spent, currency)
											: t("page.price_unavailable")}
									</span>
								</div>
								{valueTotals.isPartial && (
									<p className="text-xs text-subtle">
										{t("page.partial_total_note")}
									</p>
								)}
							</section>

							<div className="space-y-4">
								{stats.bySet.map((set) => (
									<section key={set.setCode} className="space-y-2">
										<h3 className="font-semibold text-body">
											{setNames.get(set.setCode) ?? set.setCode}
										</h3>
										<p className="text-xs text-subtle">
											{t("stats.packs_opened_for_set", {
												count: set.packsOpened,
											})}
										</p>
										<ul className="space-y-1 text-sm">
											{set.rarities.map((rarity) => (
												<li
													key={rarity.rarity}
													className="flex items-center gap-2"
												>
													<img
														src={CardRarities[rarity.rarity].icon}
														alt=""
														className="h-4 w-4 shrink-0"
													/>
													<span className="flex-1 text-body">
														{t(CardRarities[rarity.rarity].label)}
													</span>
													<span className="font-card-stat shrink-0 text-xs text-subtle">
														{rarity.pulled} · {rarity.pulledPercent.toFixed(0)}%
														{rarity.expectedPercent !== null &&
															` (${t("stats.expected_short")} ${rarity.expectedPercent.toFixed(0)}%)`}
													</span>
												</li>
											))}
										</ul>
									</section>
								))}
							</div>
						</>
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
