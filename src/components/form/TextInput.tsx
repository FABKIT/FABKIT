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
import type { ChangeEvent, InputHTMLAttributes, Ref } from "react";
import { useRef, useState } from "react";

// Headless UI's Input<TTag> generic doesn't narrow to "input" via JSX inference,
// so we cast to accept standard InputHTMLAttributes directly. Runtime behaviour
// is unchanged — Field/Label context wiring still works.
const HUIInput = Input as React.ComponentType<
	InputHTMLAttributes<HTMLInputElement> & { ref?: Ref<HTMLInputElement> }
>;

interface TextInputProps
	extends Omit<
		InputHTMLAttributes<HTMLInputElement>,
		"className" | "onChange"
	> {
	/** Input label text (always shown) */
	label: string;

	/** Optional helper text shown below label */
	description?: string;

	/** Shows asterisk indicator, doesn't enforce HTML5 validation */
	required?: boolean;

	/** Callback when value changes, receives new string value */
	onChange?: (value: string) => void;

	/** When set, makes the field read-only and shows this text inside the input on hover/touch */
	warning?: string;
}

export default function TextInput({
	label,
	description,
	required,
	warning,
	value,
	onChange,
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
				<HUIInput
					{...props}
					value={showWarning && warning ? warning : (value ?? "")}
					readOnly={!!warning}
					onChange={(event: ChangeEvent<HTMLInputElement>) =>
						onChange?.(event.target.value)
					}
					className={`w-full px-3 py-1.5 bg-surface border border-border rounded-md ${showWarning && warning ? "text-primary" : "text-body"} placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all data-[disabled]:opacity-50 ${warning ? "pointer-events-none" : ""}`}
				/>
			</div>
		</Field>
	);
}
