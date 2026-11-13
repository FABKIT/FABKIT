import type {
	PackConfig,
	PackSlotSpec,
	RarityWeight,
} from "@fabkit/apps/pack-opener/pack/types";
import { CardRarities } from "@fabkit/shared/config/cards/rarities";
import { useTranslation } from "react-i18next";

/** Deduped, translated rarity names a slot can land on — expansion-slot
 * and class/generic distinctions are already carried by the slot's own
 * label, so this only needs the rarity list itself, not the engine's internal
 * weighting. */
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

/** A premium slot with no fixed foil isn't really a foil slot: the Antiquity
 * Pack's deals a regular Majestic 7 times in 8, with a foil only as the
 * occasional upgrade, so "Premium Foil" would overpromise it. */
function slotLabelKey(slot: PackSlotSpec): string {
	return slot.kind === "premium-foil" && !slot.fixedTreatment
		? "dialog.slot.majestic"
		: `dialog.slot.${slot.kind}`;
}

export function PackContentsSection({ config }: { config: PackConfig }) {
	const { t } = useTranslation("pack-opener");

	return (
		<section className="space-y-2">
			<h3 className="font-semibold text-body">
				{t("dialog.pack_contents_title")}
			</h3>
			<ul className="space-y-1.5 text-sm">
				{config.slots.map((slot, index) => {
					const rarities = rarityNames(slot.rarityTable, t);
					return (
						<li
							// biome-ignore lint/suspicious/noArrayIndexKey: slots have no stable id and never reorder within a render
							key={index}
							className="flex flex-col"
						>
							<span className="text-body">
								{t("dialog.slot_line", {
									amount: slot.count,
									label: t(slotLabelKey(slot)),
								})}
							</span>
							<span className="text-xs text-subtle">
								{slot.fixedTreatment && slot.fixedTreatment !== "standard"
									? t("dialog.slot_rarities_treatment", {
											rarities,
											treatment: t(`dialog.treatment.${slot.fixedTreatment}`),
										})
									: rarities}
							</span>
						</li>
					);
				})}
			</ul>
		</section>
	);
}
