import { Fragment } from "react";
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

	/**
	 * Renders the option as a call to action rather than a value: accented,
	 * separated from the values below it, and never shown with a check mark.
	 * Callers own what selecting it means. List action options first — the
	 * options list scrolls, so anything at the bottom is easy to miss.
	 */
	variant?: "action";

	/** Optional leading icon, mainly for action options */
	icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;

	/** Small trailing pill, for marking an option's provenance (e.g. "custom"). */
	badge?: string;

	/**
	 * Renders a small non-selectable heading directly ABOVE this option,
	 * turning a flat list into labelled runs. Set it on the first option of
	 * each run and leave it off everywhere else.
	 *
	 * Deliberately a property of the option rather than a separate "groups"
	 * prop: every existing caller passes a flat array and keeps working
	 * untouched, and a caller that wants headings does not have to
	 * restructure its data to get them.
	 */
	sectionLabel?: string;
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

	/** Class name for custom styling */
	className?: string;
	/** Class names for custom button styling */
	buttonClassName?: string;
	/** Overrides the button's visible-value span (default: text-body when a
	 * value is selected, text-faint otherwise). Setting this to something
	 * like "text-transparent" visually hides the label text while keeping
	 * it in the accessible name/value chain — for a caller whose button
	 * already shows the current value another way (e.g. pack-opener's
	 * SetCarousel, which renders the selected set's logo next to a
	 * collapsed chevron-only button) and doesn't want it duplicated as
	 * visible text. Note this only affects the closed button; option rows
	 * in the open list always show their own real label. */
	valueClassName?: string;
	/** Class names for the open dropdown panel. The default anchors its
	 * width to the trigger button's own rendered width (w-(--button-width)),
	 * which looks wrong for a caller whose button is deliberately small
	 * (see valueClassName above) but whose option labels are normal-length
	 * text — pass a fixed width here instead in that case. */
	optionsClassName?: string;
	/** Native tooltip text for the button, for cases where the label may be truncated */
	title?: string;
	/** Accessible name for the button, for cases where no visible <Label> is rendered (label=null) */
	ariaLabel?: string;
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
	className,
	buttonClassName,
	valueClassName,
	optionsClassName,
	title,
	ariaLabel,
}: SelectProps<T>) {
	const selectedOption = options.find((opt) => opt.value === value);

	return (
		<Field className={className ?? "space-y-1.5"} data-value={value}>
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
				<ListboxButton
					title={title}
					aria-label={ariaLabel}
					className={
						buttonClassName ??
						"relative w-full px-3 py-1.5 bg-surface border border-border rounded-md text-left text-body focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed"
					}
				>
					<span
						className={
							valueClassName ?? (selectedOption ? "text-body" : "text-faint")
						}
					>
						{selectedOption?.label || placeholder || "Select an option"}
						{selectedOption?.badge && (
							<span className="ml-2 rounded-full bg-surface-active px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-subtle">
								{selectedOption.badge}
							</span>
						)}
					</span>
					<ChevronDown
						className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none"
						strokeWidth={2}
					/>
				</ListboxButton>
				<ListboxOptions
					anchor="bottom"
					className={
						optionsClassName ??
						"mt-1 w-(--button-width) bg-surface border border-border rounded-md shadow-lg py-1 focus:outline-none z-50 max-h-60 overflow-auto"
					}
				>
					{options.map((option) => {
						const isAction = option.variant === "action";
						const Icon = option.icon;
						return (
							<Fragment key={`${option.value}-group`}>
								{option.sectionLabel && (
									// Not a ListboxOption: a heading must not be
									// selectable or sit in the keyboard order.
									// aria-hidden because the options below it
									// already carry their own accessible names.
									<div
										aria-hidden="true"
										className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-subtle"
									>
										{option.sectionLabel}
									</div>
								)}
								<ListboxOption
									key={option.value}
									value={option.value}
									className={
										isAction
											? "relative flex items-center gap-2 mb-1 px-3 py-2 cursor-pointer select-none border-b border-border-primary bg-primary/10 text-primary font-semibold leading-snug data-focus:bg-primary/20 transition-colors"
											: "relative px-3 py-2 cursor-pointer select-none text-body data-focus:bg-surface-muted data-selected:bg-primary/5 transition-colors"
									}
								>
									{({ selected }) =>
										isAction ? (
											<>
												{Icon && <Icon className="w-4 h-4 shrink-0" />}
												<span>{option.label}</span>
											</>
										) : (
											<>
												<span
													className={selected ? "font-medium" : "font-normal"}
												>
													{option.label}
												</span>
												{option.badge && (
													<span className="ml-2 rounded-full bg-surface-active px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-subtle">
														{option.badge}
													</span>
												)}
												{selected && (
													<Check
														className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary"
														strokeWidth={2.5}
													/>
												)}
											</>
										)
									}
								</ListboxOption>
							</Fragment>
						);
					})}
				</ListboxOptions>
			</Listbox>
		</Field>
	);
}
