import type { CelebrationTier } from "@fabkit/apps/pack-opener/cards/celebration-tier";
import { LegendaryFireworks } from "@fabkit/apps/pack-opener/components/scene/LegendaryFireworks";
import { PullCelebration } from "@fabkit/apps/pack-opener/components/scene/PullCelebration";
import { PullSparkles } from "@fabkit/apps/pack-opener/components/scene/PullSparkles";

interface CelebrationEffectsProps {
	tier: CelebrationTier;
	phaseStartedAt: number | null;
}

/** Everything behind the card for a celebrated pull: the glow for every tier,
 * then particles and fireworks for the tiers config/celebration.ts gives them. */
export function CelebrationEffects({
	tier,
	phaseStartedAt,
}: CelebrationEffectsProps) {
	return (
		<>
			<PullCelebration tier={tier} phaseStartedAt={phaseStartedAt} />
			<PullSparkles tier={tier} />
			<LegendaryFireworks tier={tier} />
		</>
	);
}
