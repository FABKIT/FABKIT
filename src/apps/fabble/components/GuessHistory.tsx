import type { FabbleMode } from "../config";
import { useFabbleStore } from "../stores/fabble";
import type { GuessResult } from "../types";
import { FeedbackBlock } from "./FeedbackBlock";

interface GuessHistoryProps {
	mode: FabbleMode;
}

export function GuessHistory({ mode }: GuessHistoryProps) {
	const session = useFabbleStore((s) => s.sessions[mode]);
	const cardsById = useFabbleStore((s) => s.cardsById);
	const markGuessAnimated = useFabbleStore((s) => s.markGuessAnimated);

	if (!session || !cardsById || session.order.length === 0) return null;

	const resultsById = new Map<string, GuessResult>([
		...session.guesses.map((g): [string, GuessResult] => [g.guessId, g]),
		...session.twinGuesses.map((g): [string, GuessResult] => [g.guessId, g]),
	]);
	const order = [...session.order].reverse();

	return (
		<div className="flex w-full max-w-180 flex-col gap-5">
			{order.map((guessId) => {
				const result = resultsById.get(guessId);
				const card = cardsById.get(guessId);
				if (!result || !card) return null;
				return (
					<FeedbackBlock
						key={guessId}
						result={result}
						card={card}
						alreadyAnimated={session.animatedGuessIds.includes(guessId)}
						onAnimated={() => markGuessAnimated(mode, guessId)}
					/>
				);
			})}
		</div>
	);
}
