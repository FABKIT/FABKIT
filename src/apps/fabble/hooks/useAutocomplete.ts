import { useMemo, useState } from "react";
import type { AutocompleteItem } from "../lib/autocomplete";
import { searchPool } from "../lib/autocomplete";
import type { CanonicalCard } from "../lib/types";

// ─── Hook output shape ────────────────────────────────────────────────────────

export interface UseAutocompleteResult {
	inputValue: string;
	setInputValue: (v: string) => void;
	results: AutocompleteItem[];
	activeIndex: number;
	isOpen: boolean;
	handleKeyDown: (e: React.KeyboardEvent) => void;
	selectItem: (name: string) => void;
	clearInput: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAutocomplete(
	pool: CanonicalCard[],
	alreadyGuessed: string[],
	onSubmit: (name: string) => void,
): UseAutocompleteResult {
	const [inputValue, setInputValueRaw] = useState("");
	const [activeIndex, setActiveIndex] = useState(-1);
	const [isOpen, setIsOpen] = useState(false);

	const results = useMemo(
		() => searchPool(inputValue, pool, alreadyGuessed),
		[inputValue, pool, alreadyGuessed],
	);

	function setInputValue(v: string): void {
		setInputValueRaw(v);
		setActiveIndex(-1);
		setIsOpen(v.trim().length > 0);
	}

	function selectItem(name: string): void {
		// Check if item is already guessed (disabled) — don't submit if so
		const item = results.find((r) => r.name === name);
		if (item?.alreadyGuessed) return;
		setInputValueRaw(name);
		setIsOpen(false);
		setActiveIndex(-1);
		onSubmit(name);
	}

	function clearInput(): void {
		setInputValueRaw("");
		setActiveIndex(-1);
		setIsOpen(false);
	}

	// Skip already-guessed items when navigating keyboard
	function nextEnabledIndex(from: number, direction: 1 | -1): number {
		const len = results.length;
		if (len === 0) return -1;
		let idx = from;
		for (let i = 0; i < len; i++) {
			idx = (((idx + direction) % len) + len) % len;
			if (!results[idx].alreadyGuessed) return idx;
		}
		return -1; // all disabled
	}

	function handleKeyDown(e: React.KeyboardEvent): void {
		if (!isOpen && e.key !== "ArrowDown") return;

		switch (e.key) {
			case "ArrowDown": {
				e.preventDefault();
				if (!isOpen && inputValue.trim().length > 0) {
					setIsOpen(true);
					return;
				}
				const next = nextEnabledIndex(activeIndex, 1);
				setActiveIndex(next);
				break;
			}
			case "ArrowUp": {
				e.preventDefault();
				const prev = nextEnabledIndex(activeIndex, -1);
				setActiveIndex(prev);
				break;
			}
			case "Enter": {
				e.preventDefault();
				if (activeIndex >= 0 && activeIndex < results.length) {
					const item = results[activeIndex];
					if (!item.alreadyGuessed) {
						selectItem(item.name);
					}
					// If disabled (already guessed), Enter is a no-op per spec
				} else if (results.length > 0) {
					// Submit top enabled match
					const topEnabled = results.find((r) => !r.alreadyGuessed);
					if (topEnabled) selectItem(topEnabled.name);
				}
				break;
			}
			case "Escape": {
				setIsOpen(false);
				setActiveIndex(-1);
				break;
			}
			case "Tab": {
				setIsOpen(false);
				setActiveIndex(-1);
				break;
			}
		}
	}

	return {
		inputValue,
		setInputValue,
		results,
		activeIndex,
		isOpen,
		handleKeyDown,
		selectItem,
		clearInput,
	};
}

