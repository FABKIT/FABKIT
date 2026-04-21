/**
 * Text Input Component
 *
 * Styled text input field built on Headless UI with semantic color tokens.
 * Provides consistent styling, accessibility, and label/description support.
 *
 * ## Features
 * - Semantic color tokens (bg-surface, text-body, border-border, etc.)
 * - Required field indicator (asterisk)
 * - Optional description text
 * - Focus ring with primary color
 * - Disabled state styling
 * - Full accessibility via Headless UI
 *
 * @example
 * <TextInput
 *   label="Card Name"
 *   description="Enter the name for your custom card"
 *   value={cardName}
 *   onChange={setCardName}
 *   required
 *   maxLength={50}
 * />
 */

import { Description, Field, Input, Label } from "@headlessui/react";
import type { ChangeEvent, ComponentProps } from "react";
import { useRef, useState } from "react";

/**
 * Props for TextInput component.
 * Extends Headless UI Input props (excluding className which is controlled internally).
 */
interface TextInputProps
	extends Omit<ComponentProps<typeof Input>, "className"> {
	/** Input label text (always shown) */
	label: string;

	/** Optional helper text shown below label */
	description?: string;

	/** Shows asterisk indicator, doesn't enforce HTML5 validation */
	required?: boolean;

	/** Current input value (controlled component) */
	value?: string;

	/** Placeholder text when empty */
	placeholder?: string;

	/** Maximum character length */
	maxLength?: number;

	/** Callback when value changes, receives new string value */
	onChange?: (value: string) => void;

	/** When set, makes the field read-only and shows this text inside the input on hover/touch */
	warning?: string;
}

/**
 * Styled text input with label and description.
 * Uses semantic color tokens from design system.
 */
export default function TextInput({
	label,
	description,
	required,
	warning,
	...props
}: TextInputProps) {
	const [showWarning, setShowWarning] = useState(false);
	const touchHideRef = useRef<ReturnType<typeof setTimeout>>(null);

	const warningHandlers = warning
		? {
				onMouseEnter: () => setShowWarning(true),
				onMouseLeave: () => setShowWarning(false),
				onTouchStart: () => {
					if (touchHideRef.current) clearTimeout(touchHideRef.current);
					setShowWarning(true);
				},
				onTouchEnd: () => {
					touchHideRef.current = setTimeout(() => setShowWarning(false), 2000);
				},
				onTouchCancel: () => setShowWarning(false),
			}
		: {};

	return (
		<Field className="space-y-1.5">
			<Label className="block text-sm font-medium text-muted">
				{label}
				{required && <span className="text-primary ml-1">*</span>}
			</Label>
			{description && (
				<Description className="text-xs text-subtle">{description}</Description>
			)}
			<div
				className={warning ? "cursor-not-allowed" : undefined}
				{...warningHandlers}
			>
				<Input
					{...props}
					value={showWarning && warning ? warning : (props.value ?? "")}
					readOnly={!!warning}
					onChange={(event: ChangeEvent<HTMLInputElement>) =>
						props.onChange?.(event.target.value)
					}
					className={`w-full px-3 py-1.5 bg-surface border border-border rounded-md ${showWarning && warning ? "text-primary" : "text-body"} placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all data-[disabled]:opacity-50 ${warning ? "pointer-events-none" : ""}`}
				/>
			</div>
		</Field>
	);
}
