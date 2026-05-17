import { Check } from "lucide-react";
import type { AutocompleteItem as AutocompleteItemType } from "../../lib/autocomplete";
import { FAB_CDN_BASE } from "../../lib/constants";

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
	function handleClick() {
		if (!isDisabled) {
			onSelect(item.name);
		}
	}

	// tabIndex={-1}: programmatically focusable (satisfies Biome) but NOT a tab stop.
	// Keyboard focus stays on the input; active item communicated via aria-activedescendant.
	return (
		<div
			role="option"
			aria-selected={isActive}
			aria-disabled={isDisabled}
			tabIndex={-1}
			onClick={handleClick}
			onKeyDown={(e) => {
				if (e.key === "Enter") handleClick();
			}}
			className={[
				"flex items-center gap-2 px-2 py-1.5 cursor-pointer min-h-[44px]",
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
					width={30}
					height={42}
					className="rounded shrink-0 object-cover bg-surface-muted"
					style={{ width: 30, height: 42 }}
				/>
			) : (
				<div
					className="rounded bg-surface-muted shrink-0"
					style={{ width: 30, height: 42 }}
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


