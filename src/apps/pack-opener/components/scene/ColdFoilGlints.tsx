import type { ResolvedCard } from "@fabkit/apps/pack-opener/cards/card-resolver";
import { getGlintTexture } from "@fabkit/apps/pack-opener/components/scene/textures/glint-texture";
import { GLINT_COLOR_BY_TREATMENT } from "@fabkit/apps/pack-opener/config/celebration";
import {
	CARD_HEIGHT,
	CARD_WIDTH,
	CELEBRATION_Z,
} from "@fabkit/apps/pack-opener/config/scene";
import { useIsDarkTheme } from "@fabkit/apps/pack-opener/hooks/useIsDarkTheme";
import { usePrefersReducedMotion } from "@fabkit/apps/pack-opener/hooks/usePrefersReducedMotion";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import {
	AdditiveBlending,
	type Mesh,
	type MeshBasicMaterial,
	type PlaneGeometry,
} from "three";

const GLINT_COUNT = 7;
/** Just behind the shared celebration depth; see CELEBRATION_Z. */
const GLINT_Z = CELEBRATION_Z - 0.03;
/** Share of each glint's cycle it spends flashing. The rest is dark, so the
 * glints read as separate catches of light rather than a steady twinkle. */
const FLASH_SHARE = 0.38;
/** The glints sit on a rectangle this much larger than the card. Being further
 * from the camera shrinks that rectangle on screen back to the card's own
 * outline, so each flare is half hidden by the card and half past its edge. */
const EDGE_SPREAD = 1.2;
const HALF_WIDTH = (CARD_WIDTH / 2) * EDGE_SPREAD;
const HALF_HEIGHT = (CARD_HEIGHT / 2) * EDGE_SPREAD;

/** A repeatable 0..1 number for a glint and a slot, so each glint keeps its
 * own rhythm and size without storing anything. */
function seeded(glint: number, slot: number): number {
	const value = Math.sin(glint * 127.1 + slot * 311.7) * 43758.5453;
	return value - Math.floor(value);
}

/** Walks the card's outline clockwise from the top left: 0..1 in, a point out. */
function edgePoint(along: number): [number, number] {
	let distance = along * 4 * (HALF_WIDTH + HALF_HEIGHT);
	if (distance < 2 * HALF_WIDTH) return [-HALF_WIDTH + distance, HALF_HEIGHT];
	distance -= 2 * HALF_WIDTH;
	if (distance < 2 * HALF_HEIGHT) return [HALF_WIDTH, HALF_HEIGHT - distance];
	distance -= 2 * HALF_HEIGHT;
	if (distance < 2 * HALF_WIDTH) return [HALF_WIDTH - distance, -HALF_HEIGHT];
	distance -= 2 * HALF_WIDTH;
	return [-HALF_WIDTH, -HALF_HEIGHT + distance];
}

const GLINTS = Array.from({ length: GLINT_COUNT }, (_, index) => index);

/** Flares are drawn this much larger on the light theme, where they have only
 * their colour to stand out with and no brightness. */
const LIGHT_THEME_SCALE = 1.35;

function GlintField({ color, scale }: { color: string; scale: number }) {
	const meshes = useRef<(Mesh<PlaneGeometry, MeshBasicMaterial> | null)[]>([]);
	const reducedMotion = usePrefersReducedMotion();

	useFrame(() => {
		const now = Date.now();

		for (const i of GLINTS) {
			const mesh = meshes.current[i];
			if (!mesh) continue;
			const periodMs = 1500 + seeded(i, 1) * 1500;
			const time = now / periodMs + seeded(i, 2);
			const cycle = Math.floor(time);
			const progress = (time - cycle) / FLASH_SHARE;

			// Reduced motion: a few still, dimmer flares instead of flashes.
			let flash = 0;
			if (reducedMotion) flash = i % 2 === 0 ? 0.55 : 0;
			else if (progress < 1) flash = Math.sin(Math.PI * progress) ** 2;

			// Each flash lands somewhere new on the card's edge.
			const [x, y] = edgePoint(
				seeded(i, reducedMotion ? 3 : 3 + (cycle % 1000)),
			);
			mesh.position.set(x, y, 0);
			mesh.rotation.z =
				(seeded(i, 4) - 0.5) * 0.5 + (reducedMotion ? 0 : progress * 0.25);
			mesh.scale.setScalar(
				scale * (0.7 + seeded(i, 5) * 0.5) * (0.35 + 0.65 * flash),
			);
			// Faded by opacity, never by darkening the colour: the canvas is
			// transparent, so a dark additive flare shows as a dark mark on a
			// light page.
			mesh.material.opacity = flash;
		}
	});

	return (
		<group position={[0, 0, GLINT_Z]}>
			{GLINTS.map((i) => (
				<mesh
					key={i}
					ref={(mesh: Mesh<PlaneGeometry, MeshBasicMaterial> | null) => {
						meshes.current[i] = mesh;
					}}
				>
					<planeGeometry args={[1, 1]} />
					<meshBasicMaterial
						map={getGlintTexture()}
						color={color}
						transparent
						opacity={0}
						depthWrite={false}
						blending={AdditiveBlending}
					/>
				</mesh>
			))}
		</group>
	);
}

/** Flares of light off the card's edge for a Cold Foil, like a metal card
 * catching a lamp: sharp, brief and one at a time, where the rarity effects
 * (PullSparkles, LegendaryFireworks) drift and burst. Keyed off the foiling
 * alone, so it layers over whatever the card's rarity already earns. Timed off
 * the wall clock so a remount resumes. */
export function ColdFoilGlints({
	treatment,
}: {
	treatment: ResolvedCard["treatment"];
}) {
	const isDark = useIsDarkTheme();
	const colors = GLINT_COLOR_BY_TREATMENT[treatment];
	if (!colors) return null;
	return (
		<GlintField
			color={isDark ? colors.dark : colors.light}
			scale={isDark ? 1 : LIGHT_THEME_SCALE}
		/>
	);
}
