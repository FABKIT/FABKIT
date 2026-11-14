import type { ResolvedCard } from "@fabkit/apps/pack-opener/cards/card-resolver";
import type { CelebrationTier } from "@fabkit/apps/pack-opener/cards/celebration-tier";
import { ColdFoilGlints } from "@fabkit/apps/pack-opener/components/scene/ColdFoilGlints";
import { LegendaryFireworks } from "@fabkit/apps/pack-opener/components/scene/LegendaryFireworks";
import { PullCelebration } from "@fabkit/apps/pack-opener/components/scene/PullCelebration";
import { PullSparkles } from "@fabkit/apps/pack-opener/components/scene/PullSparkles";

interface CelebrationEffectsProps {
	tier: CelebrationTier;
	treatment: ResolvedCard["treatment"];
	phaseStartedAt: number | null;
}

/** Everything behind the card for a celebrated pull: the glow for every tier,
 * particles and fireworks for the tiers config/celebration.ts gives them, and
 * metal glints for a Cold Foil of any rarity. */
export function CelebrationEffects({
	tier,
	treatment,
	phaseStartedAt,
}: CelebrationEffectsProps) {
	return (
		<>
			<PullCelebration tier={tier} phaseStartedAt={phaseStartedAt} />
			<PullSparkles tier={tier} />
			<LegendaryFireworks tier={tier} />
			<ColdFoilGlints treatment={treatment} />
		</>
	);
}
