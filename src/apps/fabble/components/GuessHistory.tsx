import type { FabbleMode } from "../config";
import { useFabbleStore } from "../stores/fabble";
import type { FabbleCard, GuessResult } from "../types";
import { FeedbackBlock } from "./FeedbackBlock";

interface GuessHistoryProps {
	mode: FabbleMode;
}

export function GuessHistory({ mode }: GuessHistoryProps) {
	const session = useFabbleStore((s) => s.sessions[mode]);
	const cardsById = useFabbleStore((s) => s.cardsById);
	const markGuessAnimated = useFabbleStore((s) => s.markGuessAnimated);

	if (!session || !cardsById || session.guesses.length === 0) return null;

	const guesses = [...session.guesses].reverse();

	return (
		<div className="flex w-full max-w-180 flex-col gap-5">
			{guesses.map((result: GuessResult) => {
				const card = cardsById.get(result.guessId) as FabbleCard;
				return (
					<FeedbackBlock
						key={result.guessId}
						result={result}
						card={card}
						alreadyAnimated={session.animatedGuessIds.includes(result.guessId)}
						onAnimated={() => markGuessAnimated(mode, result.guessId)}
					/>
				);
			})}
		</div>
	);
}
