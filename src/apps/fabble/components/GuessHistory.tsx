import type { FabbleMode } from "../config";
import { getOrderedResults, useFabbleStore } from "../stores/fabble";
import { FeedbackBlock } from "./FeedbackBlock";

interface GuessHistoryProps {
	mode: FabbleMode;
}

export function GuessHistory({ mode }: GuessHistoryProps) {
	const session = useFabbleStore((s) => s.sessions[mode]);
	const cardsById = useFabbleStore((s) => s.cardsById);
	const markGuessAnimated = useFabbleStore((s) => s.markGuessAnimated);

	if (!session || !cardsById || session.order.length === 0) return null;

	const results = [...getOrderedResults(session)].reverse();

	return (
		<div className="flex w-full max-w-180 flex-col gap-5">
			{results.map((result) => {
				const card = cardsById.get(result.guessId);
				if (!card) return null;
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
