import type { SetIndexEntry } from "@fabkit/shared/data/fab-printings";

/** Adds a heading on the first entry of each run (booster sets, then other products). */
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
			// Tint only the "Other products" heading so the break is visible while scrolling.
			sectionTinted: startsRun && isSupplemental,
		};
	});
}
