/**
 * Select Dropdown Component
 *
 * Styled select/dropdown component built on Headless UI Listbox.
 * Provides type-safe options with semantic color tokens.
 *
 * ## Features
 * - Generic type parameter for type-safe values
 * - Semantic color tokens (bg-surface, text-body, etc.)
 * - Check icon for selected state
 * - Keyboard navigation support
 * - Focus ring with primary color
 * - Anchor positioning (dropdown appears below button)
 * - Optional label and description
 *
 * @example
 * <Select
 *   label="Card Type"
 *   value={cardType}
 *   onChange={setCardType}
 *   options={[
 *     { value: "action", label: "Action" },
 *     { value: "hero", label: "Hero" }
 *   ]}
 *   placeholder="Select a card type"
 *   required
 * />
 */

import {
	Description,
	Field,
	Label,
	Listbox,
	ListboxButton,
	ListboxOption,
	ListboxOptions,
} from "@headlessui/react";
import { Check, ChevronDown } from "lucide-react";

/**
 * Single option in a Select dropdown.
 * Generic type T ensures value type safety.
 */
export interface SelectOption<T extends string> {
	/** Internal value (stored in state) */
	value: T;

	/** Display label shown to user */
	label: string;
}

/**
 * Props for Select component.
 * Generic type T propagates through value and options for type safety.
 */
interface SelectProps<T extends string> {
	/** Select label text (can be null to hide label) */
	label: string | null;

	/** Optional helper text shown below label */
	description?: string;

	/** Shows asterisk indicator in label */
	required?: boolean;

	/** Currently selected value (controlled component) */
	value: T | null;

	/** Callback when selection changes, receives new value */
	onChange: (value: T) => void;

	/** Available options to choose from */
	options: SelectOption<T>[];

	/** Placeholder text when no option selected */
	placeholder?: string;
}

/**
 * Type-safe dropdown select component.
 * Uses Headless UI Listbox for accessibility and keyboard navigation.
 */
export default function Select<T extends string>({
	label,
	description,
	required,
	value,
	onChange,
	options,
	placeholder,
}: SelectProps<T>) {
	const selectedOption = options.find((opt) => opt.value === value);

	return (
		<Field className="space-y-1.5" data-value={value}>
			{label && (
				<Label className="block text-sm font-medium text-muted">
					{label}
					{required && <span className="text-primary ml-1">*</span>}
				</Label>
			)}
			{description && (
				<Description className="text-xs text-subtle">{description}</Description>
			)}
			<Listbox value={value || undefined} onChange={onChange}>
				<ListboxButton className="relative w-full px-3 py-1.5 bg-surface border border-border rounded-md text-left text-body focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed">
					<span className={selectedOption ? "text-body" : "text-faint"}>
						{selectedOption?.label || placeholder || "Select an option"}
					</span>
					<ChevronDown
						className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none"
						strokeWidth={2}
					/>
				</ListboxButton>
				<ListboxOptions
					anchor="bottom"
					className="mt-1 w-(--button-width) bg-surface border border-border rounded-md shadow-lg py-1 focus:outline-none z-10 max-h-60 overflow-auto"
				>
					{options.map((option) => (
						<ListboxOption
							key={option.value}
							value={option.value}
							className="relative px-3 py-2 cursor-pointer select-none text-body data-focus:bg-surface-muted data-selected:bg-primary/5 transition-colors"
						>
							{({ selected }) => (
								<>
									<span className={selected ? "font-medium" : "font-normal"}>
										{option.label}
									</span>
									{selected && (
										<Check
											className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary"
											strokeWidth={2.5}
										/>
									)}
								</>
							)}
						</ListboxOption>
					))}
				</ListboxOptions>
			</Listbox>
		</Field>
	);
}
