import type { SetIndexEntry } from "@fabkit/shared/data/fab-printings";

/** Headings on the first entry of each run, so the list reads as
 * "Booster sets ... / Other products ..." rather than as one flat
 * chronological column. The index already orders it that way (see
 * scripts/build-pack-data.ts), so this only has to notice where the
 * kind changes. Nothing is hardcoded to a set code: a product's kind
 * is declared once, in config/known-sets.ts. */
export function buildSetDropdownOptions(
	sets: SetIndexEntry[],
	t: (key: string) => string,
) {
	return sets.map((set, index) => {
		const startsRun =
			index === 0 || sets[index - 1].productKind !== set.productKind;
		const isSupplemental = set.productKind === "supplemental";
		return {
			value: set.code,
			label: set.name,
			sectionLabel: startsRun
				? t(
						isSupplemental
							? "carousel.group_other_products"
							: "carousel.group_booster_sets",
					)
				: undefined,
			// The "Other products" heading carries a tint so the break is
			// visible while scrolling past it — these are Mastery Packs, promo
			// packs and bonus inserts rather than the numbered sets people
			// draft. The heading only: tinting every set under it too made the
			// list read as two competing panels.
			sectionTinted: startsRun && isSupplemental,
		};
	});
}
