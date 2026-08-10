import { CustomFrameDialog } from "@fabkit/apps/card-creator/components/custom-frames/CustomFrameDialog.tsx";
import type { CardCreatorCardBack } from "@fabkit/apps/card-creator/config/rendering.ts";
import { useCardCreator } from "@fabkit/apps/card-creator/stores/card-creator.ts";
import Select from "@fabkit/platform/components/form/Select";
import { getCardBacksForTypeAndStyle } from "@fabkit/shared/config/cards/card_backs.ts";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { HybridBlendField } from "./HybridBlendField.tsx";

// Sentinel value for the "Add custom frame" row. Kept out of the card back
// list itself so the arrow buttons can never land on it and the hybrid
// toggle's "at least two frames" check stays honest.
const ADD_CUSTOM_FRAME = "__add_custom_frame__";

// Shared between the single (non-hybrid) select and both halves of the hybrid
// split, so the three can never visually drift apart from one another.
// Fixed height (matching the arrow buttons' h-10) rather than vertical
// padding — hybrid mode has no arrow buttons to set the row height, so
// without a matching fixed height the whole control shrinks and everything
// below it on the page jumps up when hybrid is toggled on.
const SELECT_CLASS_NAME =
	"col-start-1 row-start-1 w-full text-center font-bold bg-transparent text-sm focus:outline-none";
const SELECT_BUTTON_CLASS_NAME =
	"relative w-full h-10 leading-10 rounded-md truncate text-body focus:outline-none focus:ring-none focus:border-none transition-all data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed";

export function CardBackField() {
	const { t } = useTranslation("card-creator");
	const CardType = useCardCreator((state) => state.CardType);
	const CardBack = useCardCreator((state) => state.CardBack);
	const CardBackRight = useCardCreator((state) => state.CardBackRight);
	const CardBackStyle = useCardCreator((state) => state.CardBackStyle);
	const setCardBack = useCardCreator((state) => state.setCardBack);
	const setCardBackRight = useCardCreator((state) => state.setCardBackRight);

	const options = useMemo(
		() =>
			getCardBacksForTypeAndStyle(
				CardType,
				CardBackStyle,
			) as CardCreatorCardBack[],
		[CardBackStyle, CardType],
	);

	const [isCustomFrameDialogOpen, setIsCustomFrameDialogOpen] = useState(false);

	// The card backs plus the action row, shared by the single select and both
	// hybrid halves so the option list can't drift between the three.
	const selectOptions = useMemo(
		() => [
			// First, not last: the list scrolls, so a row at the bottom would sit
			// out of sight below dozens of frames.
			{
				value: ADD_CUSTOM_FRAME,
				label: t("card_creator.custom_frame_action_label"),
				variant: "action" as const,
				icon: Plus,
			},
			...options.map((b) => ({ value: String(b.id), label: b.name })),
		],
		[options, t],
	);

	const handleSelect = (
		value: string,
		setter: (back: CardCreatorCardBack) => void,
	) => {
		if (value === ADD_CUSTOM_FRAME) {
			setIsCustomFrameDialogOpen(true);
			return;
		}
		const result = options.find((b) => b.id === parseInt(value, 10));
		if (result) setter(result);
	};

	const isHybrid = CardBackRight !== null;

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
		<div className="w-full max-w-[450px] border-2 border-primary rounded-lg p-1 transition-all hover:brightness-105">
			<div className="flex items-center gap-2">
				{!isHybrid && (
					<button
						type="button"
						onClick={() => navigate("prev")}
						disabled={options.length <= 1}
						className="flex items-center justify-center min-w-10 h-10 border-2 border-primary rounded-md text-primary transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
					>
						<ChevronLeft className="w-5 h-5" />
					</button>
				)}

				{isHybrid ? (
					<>
						<div className="relative flex-1 grid grid-cols-1">
							<Select
								value={String(CardBack?.id ?? "")}
								onChange={(value) => handleSelect(value, setCardBack)}
								options={selectOptions}
								label={null}
								title={CardBack?.name}
								className={SELECT_CLASS_NAME}
								buttonClassName={SELECT_BUTTON_CLASS_NAME}
								ariaLabel={t("card_creator.hybrid_left_label")}
							/>
						</div>

						<div className="w-px self-stretch bg-primary/30 shrink-0" />

						<div className="relative flex-1 grid grid-cols-1">
							<Select
								value={String(CardBackRight?.id ?? "")}
								onChange={(value) => handleSelect(value, setCardBackRight)}
								options={selectOptions}
								label={null}
								title={CardBackRight?.name}
								className={SELECT_CLASS_NAME}
								buttonClassName={SELECT_BUTTON_CLASS_NAME}
								ariaLabel={t("card_creator.hybrid_right_label")}
							/>
						</div>
					</>
				) : (
					<div className="relative flex-1 grid grid-cols-1">
						<Select
							value={String(CardBack?.id ?? "")}
							onChange={(value) => handleSelect(value, setCardBack)}
							options={selectOptions}
							label={null}
							className={SELECT_CLASS_NAME}
							buttonClassName={SELECT_BUTTON_CLASS_NAME}
						/>
					</div>
				)}

				{!isHybrid && (
					<button
						type="button"
						onClick={() => navigate("next")}
						disabled={options.length <= 1}
						className="flex items-center justify-center min-w-10 h-10 border-2 border-primary rounded-md text-primary transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
					>
						<ChevronRight className="w-5 h-5" />
					</button>
				)}
			</div>

			{/* Seam softness sits inside the picker's border — same control family,
			    and it keeps the card preview from being pushed down the page. */}
			<HybridBlendField />

			<CustomFrameDialog
				key={isCustomFrameDialogOpen ? "frame-open" : "frame-closed"}
				open={isCustomFrameDialogOpen}
				onClose={() => setIsCustomFrameDialogOpen(false)}
			/>
		</div>
	);
}
