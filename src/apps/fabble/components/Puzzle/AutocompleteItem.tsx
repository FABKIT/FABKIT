import type { AutocompleteItem as AutocompleteItemType } from "@fabkit/apps/fabble/lib/autocomplete";
import { FAB_CDN_BASE } from "@fabkit/apps/fabble/lib/constants";
import { Check } from "lucide-react";
import { useCallback } from "react";

interface AutocompleteItemProps {
	item: AutocompleteItemType;
	isActive: boolean;
	isDisabled: boolean;
	onSelect: (name: string) => void;
}

export function AutocompleteItem({
	item,
	isActive,
	isDisabled,
	onSelect,
}: AutocompleteItemProps) {
	const handleClick = useCallback(() => {
		if (!isDisabled) {
			onSelect(item.name);
		}
	}, [isDisabled, onSelect, item.name]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Enter") handleClick();
		},
		[handleClick],
	);

	// tabIndex={-1}: programmatically focusable (satisfies Biome) but NOT a tab stop.
	// Keyboard focus stays on the input; active item communicated via aria-activedescendant.
	return (
		<div
			role="option"
			aria-selected={isActive}
			aria-disabled={isDisabled}
			tabIndex={-1}
			onClick={handleClick}
			onKeyDown={handleKeyDown}
			className={[
				"flex items-center gap-2 px-2 py-1.5 cursor-pointer min-h-11",
				isActive ? "bg-surface-active" : "hover:bg-surface-muted",
				isDisabled ? "opacity-50 cursor-not-allowed" : "",
			]
				.filter(Boolean)
				.join(" ")}
		>
			{item.imageKey ? (
				<img
					src={`${FAB_CDN_BASE}${item.imageKey}.png`}
					alt=""
					aria-hidden="true"
					className="rounded shrink-0 object-cover bg-surface-muted w-[30px] h-[42px]"
				/>
			) : (
				<div
					className="rounded bg-surface-muted shrink-0 w-[30px] h-[42px]"
					aria-hidden="true"
				/>
			)}
			<div className="flex flex-col min-w-0 flex-1">
				<span className="text-sm font-medium text-body truncate">
					{item.name}
				</span>
				{item.types.length > 0 && (
					<span className="text-xs text-muted truncate">
						{item.types.join(" / ")}
					</span>
				)}
			</div>
			{isDisabled && (
				<Check className="size-4 text-muted shrink-0" aria-hidden="true" />
			)}
		</div>
	);
}
