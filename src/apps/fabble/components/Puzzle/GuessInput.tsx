import { useCallback, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useAutocomplete } from "@fabkit/apps/fabble/hooks/useAutocomplete";
import type { CanonicalCard } from "@fabkit/apps/fabble/lib/types";
import { AutocompleteDropdown } from "./AutocompleteDropdown";

interface GuessInputProps {
	pool: CanonicalCard[];
	alreadyGuessed: string[];
	onSubmit: (name: string) => void;
	submitError: string | null;
	guessesRemaining: number;
}

export function GuessInput({
	pool,
	alreadyGuessed,
	onSubmit,
	submitError,
	guessesRemaining,
}: GuessInputProps) {
	const { t } = useTranslation("fabble");
	const inputRef = useRef<HTMLInputElement>(null);

	const refocusInput = useCallback(() => {
		setTimeout(() => inputRef.current?.focus(), 0);
	}, []);

	const {
		inputValue,
		setInputValue,
		results,
		activeIndex,
		isOpen,
		handleKeyDown,
		selectItem,
		clearInput,
	} = useAutocomplete(pool, alreadyGuessed, (name) => {
		onSubmit(name);
		clearInput();
		refocusInput();
	});

	const handleSubmit = useCallback(() => {
		if (inputValue.trim().length === 0) return;
		if (activeIndex >= 0 && activeIndex < results.length) {
			const item = results[activeIndex];
			if (!item?.alreadyGuessed) {
				selectItem(item?.name ?? "");
				return;
			}
		}
		const match = pool.find(
			(c) => c.name.toLowerCase() === inputValue.trim().toLowerCase(),
		);
		if (match) {
			onSubmit(match.name);
			clearInput();
			refocusInput();
		} else if (results.length > 0) {
			const topEnabled = results.find((r) => !r.alreadyGuessed);
			if (topEnabled) {
				selectItem(topEnabled.name);
			}
		}
	}, [inputValue, activeIndex, results, pool, onSubmit, selectItem, clearInput, refocusInput]);

	const handleDropdownSelect = useCallback((name: string) => {
		selectItem(name);
		refocusInput();
	}, [selectItem, refocusInput]);

	const canSubmit = useMemo(
		() =>
			inputValue.trim().length > 0 &&
			(activeIndex >= 0 || results.some((r) => !r.alreadyGuessed)),
		[inputValue, activeIndex, results],
	);

	return (
		<div className="w-full max-w-md mx-auto">
			<div className="relative flex flex-col gap-2">
				<div className="relative">
					<input
						ref={inputRef}
						type="text"
						role="combobox"
						aria-expanded={isOpen}
						aria-autocomplete="list"
						aria-controls="fabble-autocomplete"
						aria-activedescendant={
							activeIndex >= 0 ? `fabble-option-${activeIndex}` : undefined
						}
						value={inputValue}
						onChange={(e) => setInputValue(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder={t("input.placeholder")}
						className="w-full px-3 py-2.5 min-h-11 border border-border rounded-md text-sm text-body bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
						autoComplete="off"
					/>
					{isOpen && results.length > 0 && (
						<AutocompleteDropdown
							items={results}
							activeIndex={activeIndex}
							onSelect={handleDropdownSelect}
						/>
					)}
				</div>
				<button
					type="button"
					onClick={handleSubmit}
					disabled={!canSubmit}
					aria-label={t("aria.submit_guess")}
					className="w-full min-h-11 px-4 py-2.5 bg-primary text-on-primary text-sm font-semibold rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{t("input.submit")}
				</button>
				<p className="text-center text-xs text-muted">
					{t("input.guesses_remaining", { count: guessesRemaining })}
				</p>
				<p
					role="status"
					aria-live="polite"
					aria-atomic="true"
					className="text-xs text-fabble-no-match-text bg-fabble-no-match rounded px-2 py-1 min-h-6 empty:hidden"
				>
					{submitError}
				</p>
			</div>
		</div>
	);
}
