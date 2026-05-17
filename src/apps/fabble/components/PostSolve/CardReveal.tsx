import { FAB_CDN_BASE } from "../../lib/constants";
import type { DailyCard } from "../../lib/types";

interface CardRevealProps {
	daily: DailyCard;
	won: boolean;
}

export function CardReveal({ daily, won }: CardRevealProps) {
	const imageUrl = `${FAB_CDN_BASE}${daily.pitchVariantImage}.webp`;

	return (
		<div className="flex justify-center fade-in-bottom shrink-0">
			<img
				src={imageUrl}
				alt={daily.name}
				className={[
					"rounded-xl shadow-lg max-h-[440px] w-auto object-contain",
					won ? "fabble-card-sparkle" : "grayscale opacity-75",
				]
					.filter(Boolean)
					.join(" ")}
				loading="lazy"
			/>
		</div>
	);
}


