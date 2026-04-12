/**
 * Slider Input Component
 *
 * Range slider input built on native HTML input with semantic color tokens.
 * Provides consistent styling, accessibility, and label/description support.
 *
 * ## Features
 * - Semantic color tokens (bg-surface, text-body, border-border, etc.)
 * - Required field indicator (asterisk)
 * - Optional description text
 * - Optional value display
 * - Focus ring with primary color
 * - Disabled state styling
 * - Full accessibility via native input
 *
 * @example
 * <Slider
 *   label="Opacity"
 *   description="Adjust the overlay opacity"
 *   value={opacity}
 *   onChange={setOpacity}
 *   min={0}
 *   max={1}
 *   step={0.01}
 *   showValue
 *   formatValue={(v) => `${Math.round(v * 100)}%`}
 * />
 */

import { Description, Field, Label } from "@headlessui/react";
import type { ChangeEvent, ComponentProps } from "react";

/**
 * Props for Slider component.
 * Extends native input props (excluding className and type which are controlled internally).
 */
interface SliderProps
	extends Omit<ComponentProps<"input">, "className" | "type" | "onChange"> {
	/** Slider label text (always shown) */
	label: string;

	/** Optional helper text shown below label */
	description?: string;

	/** Shows asterisk indicator, doesn't enforce HTML5 validation */
	required?: boolean;

	/** Current slider value (controlled component) */
	value?: number;

	/** Minimum value (default: 0) */
	min?: number;

	/** Maximum value (default: 100) */
	max?: number;

	/** Step increment (default: 1) */
	step?: number;

	/** Optional formatter for the displayed value */
	formatValue?: (value: number) => string;

	/** Callback when value changes, receives new number value */
	onChange?: (value: number) => void;
}

/**
 * Styled range slider with label and description.
 * Uses semantic color tokens from design system.
 */
export default function Slider({
	label,
	description,
	required,
	value = 0,
	min = 0,
	max = 100,
	step = 1,
	formatValue,
	onChange,
	...props
}: SliderProps) {
	return (
		<Field className="space-y-1">
			<div className="flex items-center justify-between">
				<Label className="block text-sm font-medium text-muted">
					{label}
					{required && <span className="text-primary ml-1">*</span>}
				</Label>
			</div>
			{description && (
				<Description className="text-xs text-subtle">{description}</Description>
			)}
			<input
				{...props}
				type="range"
				value={value}
				min={min}
				max={max}
				step={step}
				onChange={(event: ChangeEvent<HTMLInputElement>) =>
					onChange?.(Number.parseFloat(event.target.value))
				}
				className="w-full h-2 bg-surface-muted rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:scale-110 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:hover:scale-110"
			/>
		</Field>
	);
}
