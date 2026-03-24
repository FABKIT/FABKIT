import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo } from "react";
import {
	CardBacks,
	getCardBacksForTypeAndStyle,
} from "../../../config/cards/card_backs.ts";
import { useCardCreator } from "../../../stores/card-creator.ts";

export function CardBackField() {
	const CardType = useCardCreator((state) => state.CardType);
	const CardBack = useCardCreator((state) => state.CardBack);
	const CardBackStyle = useCardCreator((state) => state.CardBackStyle);
	const setCardBack = useCardCreator((state) => state.setCardBack);

	const options = useMemo(
		() => getCardBacksForTypeAndStyle(CardType, CardBackStyle),
		[CardBackStyle, CardType],
	);

	let currentIndex =
		CardBack === null ? 0 : options.findIndex((b) => b.id === CardBack?.id);

	if (currentIndex === -1) {
		currentIndex = 0;
	}

	const navigate = (dir: "prev" | "next") => {
		if (options.length === 0) return;
		const next =
			dir === "prev"
				? (currentIndex - 1 + options.length) % options.length
				: (currentIndex + 1) % options.length;
		setCardBack(options[next]);
	};

	return (
		<div className="flex items-center gap-2 w-full max-w-[450px] border-2 border-primary rounded-lg p-1 transition-all hover:brightness-105">
			<button
				type="button"
				onClick={() => navigate("prev")}
				disabled={options.length <= 1}
				className="flex items-center justify-center min-w-10 h-10 border-2 border-primary rounded-md text-primary transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
			>
				<ChevronLeft className="w-5 h-5" />
			</button>

			<div className="relative flex-1 grid grid-cols-1">
				<select
					value={CardBack?.id ?? ""}
					onChange={(e) => {
						const id = parseInt(e.target.value, 10);
						const result = CardBacks.find((b) => b.id === id);
						if (result) setCardBack(result);
					}}
					className="col-start-1 row-start-1 w-full appearance-none text-center font-bold bg-transparent py-1.5 pr-8 pl-3 text-sm text-body focus:outline-none"
				>
					{options.map((back) => (
						<option key={back.id} value={back.id}>
							{back.name}
						</option>
					))}
				</select>
				<ChevronDown className="pointer-events-none col-start-1 row-start-1 self-center justify-self-end mr-2 w-4 h-4 text-body" />
			</div>

			<button
				type="button"
				onClick={() => navigate("next")}
				disabled={options.length <= 1}
				className="flex items-center justify-center min-w-10 h-10 border-2 border-primary rounded-md text-primary transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
			>
				<ChevronRight className="w-5 h-5" />
			</button>
		</div>
	);
}
