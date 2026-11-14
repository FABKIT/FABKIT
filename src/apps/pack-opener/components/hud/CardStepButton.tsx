import { usePackOpenerStore } from "@fabkit/apps/pack-opener/stores/pack-opener";
import { selectActiveIndex } from "@fabkit/apps/pack-opener/stores/pack-opener-types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

interface CardStepButtonProps {
	/** -1 for the previous card, 1 for the next. */
	offset: -1 | 1;
	/** Placement and display. PackOpenerPage renders a pair beside the card from
	 * `md` up and a pair beside the card's name below it, where the card is too
	 * wide to leave room at its sides. */
	className: string;
}

/** Steps to the neighbouring card of a finished pack. Only exists once the pack
 * is finished, and dims at either end of the pack. */
export function CardStepButton({ offset, className }: CardStepButtonProps) {
	const { t } = useTranslation("pack-opener");
	const phase = usePackOpenerStore((state) => state.phase);
	const packSize = usePackOpenerStore((state) => state.pack?.length ?? 0);
	const activeIndex = usePackOpenerStore(selectActiveIndex);
	const stepCard = usePackOpenerStore((state) => state.stepCard);

	if (phase !== "done") return null;

	const targetIndex = activeIndex + offset;
	const Icon = offset < 0 ? ChevronLeft : ChevronRight;
	const label = offset < 0 ? t("page.previous_card") : t("page.next_card");

	return (
		<button
			type="button"
			onClick={() => stepCard(offset)}
			disabled={targetIndex < 0 || targetIndex >= packSize}
			aria-label={label}
			title={label}
			className={`shrink-0 place-items-center rounded-full border border-primary bg-surface/80 text-primary shadow-lg backdrop-blur transition hover:bg-primary hover:text-white disabled:pointer-events-none disabled:opacity-30 ${className}`}
		>
			<Icon className="size-5" aria-hidden="true" />
		</button>
	);
}
