import type { AutocompleteItem as AutocompleteItemType } from "../../lib/autocomplete";
import { AutocompleteItem } from "./AutocompleteItem";

interface AutocompleteDropdownProps {
	items: AutocompleteItemType[];
	activeIndex: number;
	onSelect: (name: string) => void;
}

export function AutocompleteDropdown({
	items,
	activeIndex,
	onSelect,
}: AutocompleteDropdownProps) {
	if (items.length === 0) return null;

	return (
		<div
			role="listbox"
			id="fabble-autocomplete"
			className="fabble-dropdown--open absolute z-50 w-full mt-1 bg-surface border border-border rounded-md shadow-lg overflow-y-auto max-h-64"
		>
			{items.map((item, idx) => (
				<AutocompleteItem
					key={item.name}
					item={item}
					isActive={idx === activeIndex}
					isDisabled={item.alreadyGuessed}
					onSelect={onSelect}
				/>
			))}
		</div>
	);
}


