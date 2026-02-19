/**
 * ButtonDropdown Component
 *
 * A button-styled dropdown that opens a list of options when clicked.
 * Similar to Select but styled as a prominent button instead of a form input.
 *
 * ## Features
 * - Generic type parameter for type-safe values
 * - Button styled with primary color (golden background, white text)
 * - Dropdown panel with list of options
 * - Semantic color tokens matching FABKIT design system
 * - ChevronDown icon indicator
 * - Optional label (can be null to hide)
 * - Keyboard navigation and accessibility via Headless UI
 *
 * @example
 * <ButtonDropdown
 *   label={null}
 *   value={null}
 *   onChange={(type) => {
 *     setCardType(type);
 *     navigate('/card-creator');
 *   }}
 *   options={cardTypeOptions}
 *   placeholder="Select Card Type"
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
import { ChevronDown } from "lucide-react";

/**
 * Single option in the dropdown.
 * Generic type T ensures value type safety.
 */
export interface ButtonDropdownOption<T extends string> {
	/** Internal value (stored in state) */
	value: T;

	/** Display label shown to user */
	label: string;
}

/**
 * Props for ButtonDropdown component.
 * Generic type T propagates through value and options for type safety.
 */
interface ButtonDropdownProps<T extends string> {
	/** Field label text (can be null to hide label) */
	label: string | null;

	/** Optional helper text shown below label */
	description?: string;

	/** Shows asterisk indicator in label */
	required?: boolean;

	/** Currently selected value (null for action-only mode) */
	value: T | null;

	/** Callback when an option is clicked */
	onChange: (value: T) => void;

	/** Array of options to display in dropdown */
	options: ButtonDropdownOption<T>[];

	/** Placeholder text shown in button when no selection */
	placeholder?: string;
}

function ButtonDropdown<T extends string>({
	label,
	description,
	required = false,
	value,
	onChange,
	options,
	placeholder = "Select an option",
}: ButtonDropdownProps<T>) {
	// Find the selected option to display its label
	const selectedOption = options.find((opt) => opt.value === value);
	const displayText = selectedOption?.label || placeholder;

	const dropdownContent = (
		<Listbox value={value || undefined} onChange={onChange}>
			<div className="relative inline-flex">
				{/* Main button */}
				<ListboxButton
					type="button"
					className="rounded-l-lg bg-primary px-6 py-3 text-base font-semibold text-white transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 focus:ring-offset-surface"
				>
					{displayText}
				</ListboxButton>

				{/* Dropdown toggle button */}
				<ListboxButton className="rounded-r-lg border-l border-white/20 bg-primary px-3 py-3 text-white transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 focus:ring-offset-surface">
					<ChevronDown className="h-5 w-5" aria-hidden="true" />
				</ListboxButton>

				<ListboxOptions
					anchor="bottom end"
					className="mt-2 w-64 origin-top-right rounded-lg bg-surface shadow-lg ring-1 ring-border focus:outline-none [--anchor-gap:8px]"
				>
					<div className="py-1">
						{options.map((option) => (
							<ListboxOption
								key={option.value}
								value={option.value}
								className="cursor-pointer px-4 py-2 text-sm text-primary transition-colors data-[focus]:bg-surface-muted"
							>
								{option.label}
							</ListboxOption>
						))}
					</div>
				</ListboxOptions>
			</div>
		</Listbox>
	);

	// If no label, return content directly
	if (label === null) {
		return dropdownContent;
	}

	// Otherwise wrap in Field with label
	return (
		<Field>
			<Label className="block text-sm font-medium text-heading">
				{label}
				{required && <span className="ml-1 text-primary">*</span>}
			</Label>
			{description && (
				<Description className="mt-1 text-sm text-muted">
					{description}
				</Description>
			)}
			<div className="mt-3">{dropdownContent}</div>
		</Field>
	);
}

export default ButtonDropdown;
