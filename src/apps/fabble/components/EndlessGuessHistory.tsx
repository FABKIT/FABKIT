import { FeedbackBlock } from "@fabkit/apps/fabble/components/FeedbackBlock";
import {
	getOrderedEndlessResults,
	useFabbleStore,
} from "@fabkit/apps/fabble/stores/fabble";
import { useCallback } from "react";

export function EndlessGuessHistory() {
	const session = useFabbleStore((s) => s.endlessSession);
	const cardsById = useFabbleStore((s) => s.cardsById);
	const markEndlessGuessAnimated = useFabbleStore(
		(s) => s.markEndlessGuessAnimated,
	);

	const handleAnimated = useCallback(
		(guessId: string) => markEndlessGuessAnimated(guessId),
		[markEndlessGuessAnimated],
	);

	if (!session || !cardsById || session.order.length === 0) return null;

	const results = [...getOrderedEndlessResults(session)].reverse();

	return (
		<div className="flex w-full max-w-160 flex-col gap-5">
			{results.map((result) => {
				const card = cardsById.get(result.guessId);
				if (!card) return null;
				return (
					<FeedbackBlock
						key={result.guessId}
						result={result}
						card={card}
						alreadyAnimated={session.animatedGuessIds.includes(result.guessId)}
						onAnimated={handleAnimated}
					/>
				);
			})}
		</div>
	);
}
