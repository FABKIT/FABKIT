/** USD only — see the execution plan, section 2.4: no free, automatable
 * EUR/Cardmarket source was found, so this deliberately never shows a
 * converted or guessed currency. Shared by PackSummary.tsx (per-card and
 * pack-total prices) and SetInfoDialog.tsx (pack/box prices). */
const USD_FORMATTER = new Intl.NumberFormat("en-US", {
	style: "currency",
	currency: "USD",
});

export function formatUsd(amount: number): string {
	return USD_FORMATTER.format(amount);
}
