/**
 * Select Dropdown Component
 *
 * Styled select/dropdown component built on Headless UI Combobox.
 * Provides type-safe options with semantic color tokens and search functionality.
 *
 * ## Features
 * - Generic type parameter for type-safe values
 * - Searchable/filterable options by typing
 * - Semantic color tokens (bg-surface, text-body, etc.)
 * - Check icon for selected state
 * - Keyboard navigation support
 * - Focus ring with primary color
 * - Anchor positioning (dropdown appears below input)
 * - Optional label and description
 * - Closes without selection keeps current value
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
	ComboboxButton,
	ComboboxInput,
	ComboboxOption,
	ComboboxOptions,
	Description,
	Field,
	Combobox as HeadlessCombobox,
	Label,
} from "@headlessui/react";
import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { SelectOption } from "./Select.tsx";

/**
 * Props for Select component.
 * Generic type T propagates through value and options for type safety.
 */
interface ComboboxProps<T extends string> {
	/** Select label text (can be null to hide label) */
	label: string | null;

	/** Optional helper text shown below label */
	description?: string;

	/** Shows asterisk indicator in label */
	required?: boolean;

	/** Currently selected value (controlled component) */
	value: T | string | null;

	/** Callback when selection changes, receives new value */
	onChange: (value: T | string) => void;

	/** Available options to choose from */
	options: SelectOption<T>[];

	/** Placeholder text when no option selected */
	placeholder?: string;
}

/**
 * Type-safe dropdown select component with search.
 * Uses Headless UI Combobox for accessibility, keyboard navigation, and filtering.
 */
export function Combobox<T extends string>({
	label,
	description,
	required,
	value,
	onChange,
	options,
	placeholder,
}: ComboboxProps<T>) {
	const { t } = useTranslation();
	const [query, setQuery] = useState("");

	// Filter options based on search query
	const filteredOptions =
		query === ""
			? options
			: options.filter((option) =>
					option.label.toLowerCase().includes(query.toLowerCase()),
				);

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
			<HeadlessCombobox
				immediate
				value={value || undefined}
				onChange={(value) => {
					if (onChange && value) {
						onChange(value);
					}
				}}
				onClose={() => setQuery("")}
			>
				<div className="relative">
					<ComboboxInput
						displayValue={(val: T | string | undefined) =>
							val ? options.find((opt) => opt.value === val)?.label || val : ""
						}
						onChange={(event) => setQuery(event.target.value)}
						onFocus={() => setQuery("")}
						placeholder={placeholder || "Select an option"}
						className="w-full px-3 py-1.5 pr-10 bg-surface border border-border rounded-md text-body placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed"
					/>
					<ComboboxButton className="absolute right-3 top-1/2 -translate-y-1/2 group">
						<ChevronDown
							className="w-4 h-4 text-muted group-hover:text-body transition-colors"
							strokeWidth={2}
						/>
					</ComboboxButton>
				</div>
				<ComboboxOptions
					anchor="bottom"
					className="mt-1 w-(--input-width) bg-surface border border-border rounded-md shadow-lg py-1 focus:outline-none z-10 max-h-60 overflow-auto empty:invisible"
				>
					{query.length > 0 && (
						<ComboboxOption
							value={query}
							className="data-focus:bg-blue-100 mx-1"
						>
							{t("components.combobox.custom_value", { value: query })}
						</ComboboxOption>
					)}
					{filteredOptions.map((option) => (
						<ComboboxOption
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
						</ComboboxOption>
					))}
				</ComboboxOptions>
			</HeadlessCombobox>
		</Field>
	);
}
