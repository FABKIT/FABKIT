import { FeedbackBlock } from "@fabkit/apps/fabble/components/FeedbackBlock";
import type { FabbleMode } from "@fabkit/apps/fabble/config";
import {
	getOrderedResults,
	useFabbleStore,
} from "@fabkit/apps/fabble/stores/fabble";
import { useCallback } from "react";

export interface GuessHistoryProps {
	mode: FabbleMode;
}

export function GuessHistory({ mode }: GuessHistoryProps) {
	const session = useFabbleStore((s) => s.sessions[mode]);
	const cardsById = useFabbleStore((s) => s.cardsById);
	const markGuessAnimated = useFabbleStore((s) => s.markGuessAnimated);

	const handleAnimated = useCallback(
		(guessId: string) => markGuessAnimated(mode, guessId),
		[markGuessAnimated, mode],
	);

	if (!session || !cardsById || session.order.length === 0) return null;

	const results = [...getOrderedResults(session)].reverse();

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
