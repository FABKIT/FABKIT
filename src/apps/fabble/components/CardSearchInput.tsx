import type { FabbleMode } from "@fabkit/apps/fabble/config";
import { MAX_GUESSES } from "@fabkit/apps/fabble/config";
import { normalizeCardName } from "@fabkit/apps/fabble/game/normalize";
import { type SearchEntry, searchCards } from "@fabkit/apps/fabble/game/search";
import { useFabbleStore } from "@fabkit/apps/fabble/stores/fabble";
import type { FabbleCard } from "@fabkit/apps/fabble/types";
import {
	Combobox,
	ComboboxInput,
	ComboboxOption,
	ComboboxOptions,
} from "@headlessui/react";
import { Check } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useDebounce } from "use-debounce";

export interface CardSearchInputProps {
	mode: FabbleMode;
}

function findExactMatch(
	index: SearchEntry[],
	cards: Map<string, FabbleCard>,
	query: string,
): FabbleCard | undefined {
	const match = searchCards(index, query).find(
		(entry) => entry.normalized === normalizeCardName(query),
	);
	return match ? cards.get(match.id) : undefined;
}

export function CardSearchInput({ mode }: CardSearchInputProps) {
	const { t } = useTranslation("fabble");
	const [query, setQuery] = useState("");
	const [debouncedQuery] = useDebounce(query, 150);
	const [error, setError] = useState<string | null>(null);

	const searchIndex = useFabbleStore((s) => s.searchIndex);
	const cardsById = useFabbleStore((s) => s.cardsById);
	const session = useFabbleStore((s) => s.sessions[mode]);
	const submitGuess = useFabbleStore((s) => s.submitGuess);

	if (!searchIndex || !cardsById || !session) return null;
	const index = searchIndex;
	const cards = cardsById;

	const guessedIds = new Set([
		...session.guesses.map((g) => g.guessId),
		...session.twinGuesses.map((g) => g.guessId),
	]);
	const results = searchCards(searchIndex, debouncedQuery)
		.map((entry) => cardsById.get(entry.id))
		.filter((c): c is FabbleCard => c !== undefined);

	const guessCount = session.guesses.length;
	const maxGuesses = MAX_GUESSES[mode];
	const remaining = maxGuesses - guessCount;
	const isPlaying = session.status === "playing";

	function submitCard(card: FabbleCard) {
		if (!isPlaying) return;
		setError(null);
		submitGuess(mode, card.id);
		setQuery("");
	}

	function handleSelect(card: FabbleCard | null) {
		if (!card) return;
		submitCard(card);
	}

	function handleSubmit() {
		if (!isPlaying) return;
		const card = findExactMatch(index, cards, query);
		if (!card) {
			setError(t("search.not_recognized"));
			return;
		}
		if (guessedIds.has(card.id)) {
			setError(t("search.already_guessed"));
			return;
		}
		submitCard(card);
	}

	return (
		<div className="flex w-full max-w-100 flex-col items-center gap-2">
			<Combobox value={null} onChange={handleSelect} disabled={!isPlaying}>
				<div className="relative w-full">
					<ComboboxInput
						value={query}
						onChange={(event) => {
							setQuery(event.target.value);
							setError(null);
						}}
						placeholder={t("play.input_placeholder")}
						className="w-full rounded-md border border-border-primary bg-surface px-3 py-2 text-body placeholder:text-faint focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
					/>
					<ComboboxOptions
						anchor="bottom"
						className="mt-1 max-h-72 w-(--input-width) overflow-auto rounded-md border border-border-primary bg-surface py-1 shadow-lg empty:invisible"
					>
						{results.length === 0 && debouncedQuery !== "" ? (
							<div className="pointer-events-none px-3 py-2 text-sm text-muted">
								{t("search.no_results")}
							</div>
						) : (
							results.map((card) => {
								const alreadyGuessed = guessedIds.has(card.id);
								return (
									<ComboboxOption
										key={card.id}
										value={card}
										disabled={alreadyGuessed}
										className="flex cursor-pointer items-center gap-2 px-3 py-2 data-focus:bg-surface-active data-disabled:cursor-not-allowed data-disabled:opacity-50"
									>
										<img
											src={card.thumbnailUrl}
											alt=""
											loading="lazy"
											crossOrigin="anonymous"
											className="h-12.5 w-9 rounded-sm object-cover"
										/>
										<div className="flex flex-1 flex-col">
											<span className="text-sm text-body">{card.name}</span>
											<span className="text-xs text-muted">
												{t(`types.${card.type}`)}
											</span>
										</div>
										{alreadyGuessed && <Check className="h-4 w-4 text-muted" />}
									</ComboboxOption>
								);
							})
						)}
					</ComboboxOptions>
				</div>
			</Combobox>
			<button
				type="button"
				onClick={handleSubmit}
				disabled={!query.trim() || !isPlaying}
				className="w-full rounded-md bg-primary px-4 py-2.5 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
			>
				{t("play.submit")}
			</button>
			{error && <span className="text-sm text-feedback-miss">{error}</span>}
			<span className="text-sm text-muted">
				{t("play.guesses_remaining", { count: remaining })}
			</span>
		</div>
	);
}
