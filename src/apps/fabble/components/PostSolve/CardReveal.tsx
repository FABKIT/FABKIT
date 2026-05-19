import { FAB_CDN_BASE } from "@fabkit/apps/fabble/lib/constants";
import type { DailyCard } from "@fabkit/apps/fabble/lib/types";

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
					"rounded-xl shadow-lg max-h-110 w-auto object-contain",
					won ? "fabble-card-sparkle" : "grayscale opacity-75",
				]
					.filter(Boolean)
					.join(" ")}
				loading="lazy"
			/>
		</div>
	);
}


