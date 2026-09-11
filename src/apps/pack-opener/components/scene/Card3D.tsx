import type { ResolvedCard } from "@fabkit/apps/pack-opener/cards/card-resolver";
import { FoilMaterialImpl } from "@fabkit/apps/pack-opener/components/scene/materials/foilMaterial";
import { useCardTexture } from "@fabkit/apps/pack-opener/components/scene/textures/useCardTexture";
import { useSafeTexture } from "@fabkit/apps/pack-opener/components/scene/textures/useSafeTexture";
import {
	CARD_TILT_EASE,
	CARD_TILT_MAX_DEG,
} from "@fabkit/apps/pack-opener/config/scene";
import { usePrefersReducedMotion } from "@fabkit/apps/pack-opener/hooks/usePrefersReducedMotion";
import { useFrame } from "@react-three/fiber";
import { type RefObject, useMemo, useRef } from "react";
import type { Group, Texture } from "three";

export const CARD_WIDTH = 1.2;
export const CARD_HEIGHT = CARD_WIDTH * (628 / 450);

/** The official Flesh and Blood card back — self-hosted rather than
 * hotlinked from content.fabrary.net (see the execution plan, section 5,
 * fix 3): a loading placeholder must never itself be the thing that's
 * loading, self-hosted it gets precached by the service worker and works
 * offline, and it removes a third-party dependency from a core piece of
 * UI. Preloaded by the route loader (src/routes/pack-opener.tsx) so it's
 * normally already cached by the time any real card needs it as a stand-in
 * — see RealCardFace, which shows it while a card's art loads. */
export const CARD_BACK_URL = "/img/pack-opener/card-back.webp";

const MAX_TILT_RAD = (CARD_TILT_MAX_DEG * Math.PI) / 180;

/** The light direction the foil shader uses when prefers-reduced-motion is
 * on. Tilt itself is fully disabled then (section 3.4: "no tilt"), but a
 * light direction of (0, 0) reads as *no* foil effect at all — real foil
 * is "invisible head-on" — so this holds a fixed, gentle off-angle
 * instead: "a fixed, gentle sheen rather than an animated one." */
const REDUCED_MOTION_LIGHT_DIR = { x: 0.35, y: 0.25 };

/** The instant of the cold foil's drift cycle held still when
 * prefers-reduced-motion is on (see foilMaterial.ts, which normally sweeps
 * the reflection across the card on its own). Chosen because it puts the
 * band ON the card rather than just off its edge, so a visitor who has
 * asked for no animation still sees a foil rather than a plain card. */
const REDUCED_MOTION_FOIL_TIME = 2;

const TREATMENT_CODE: Record<ResolvedCard["treatment"], number> = {
	standard: 0,
	rainbow: 1,
	cold: 2,
	"gold-cold": 3,
};

type LightDirRef = RefObject<{ x: number; y: number }>;

interface CardFaceMaterialProps {
	texture: Texture;
	treatment: ResolvedCard["treatment"];
	isMarvel: boolean;
	/** Live tilt/light-direction offset (-1..1 each axis), read imperatively
	 * every frame — owned by Card3D's own useFrame below, which keeps the
	 * tilt group's rotation and the shader's light direction in agreement. */
	lightDirRef: LightDirRef;
	/** See Card3DProps.alwaysOnTop below — turns off depth testing/writing
	 * on this material so it always paints over whatever's behind it,
	 * regardless of z. */
	alwaysOnTop: boolean;
}

/** Plain vs. holographic foilMaterial for a resolved texture — shared by
 * both the real-image and mock-canvas rendering paths below. Every real
 * card image has transparent rounded corners baked into its own alpha
 * channel (verified directly against the webp files) — alphaTest here is
 * what actually makes them round on screen instead of square; without it
 * meshBasicMaterial ignores alpha entirely and just paints the full
 * rectangle. alphaTest (a hard per-pixel cutoff, not blended transparency)
 * keeps the material in the normal depth-tested opaque render queue rather
 * than opting into transparency sorting for a corner cutout that doesn't
 * need it — see foilMaterial.ts's own explicit `discard` for why the foil
 * path needs its own version of the same fix. */
function CardFaceMaterial({
	texture,
	treatment,
	isMarvel,
	lightDirRef,
	alwaysOnTop,
}: CardFaceMaterialProps) {
	const foilMaterial = useMemo(() => new FoilMaterialImpl(), []);
	const reducedMotion = usePrefersReducedMotion();

	useFrame((state) => {
		if (treatment === "standard") return;
		foilMaterial.uBaseTexture = texture;
		foilMaterial.uTreatment = TREATMENT_CODE[treatment];
		// How much light the foil returns, not how much of the art to
		// replace — see foilMaterial.ts, where both branches only ever
		// brighten. Marvel gets more because a Marvel is a Cold Foil card
		// people are meant to notice across a room.
		foilMaterial.uIntensity = isMarvel ? 0.7 : 0.45;
		foilMaterial.uLightDir = [lightDirRef.current.x, lightDirRef.current.y];
		// Wall-clock seconds, and the one timer in this scene that
		// deliberately does NOT read off the store's phaseStartedAt (see the
		// app's CLAUDE.md). That rule exists so the tear and the reveal can
		// never restart or disagree with each other; this is an ambient
		// surface property of a card rather than a step in that sequence,
		// it must not restart when a new card becomes active, and it has to
		// keep moving while nothing else is happening at all. Frozen for a
		// visitor who asked for reduced motion.
		foilMaterial.uTime = reducedMotion
			? REDUCED_MOTION_FOIL_TIME
			: state.clock.elapsedTime;
	});

	// Unlit on purpose: a card's own image is meant to be viewed true-to-source
	// (like a photo), not lit as a 3D object — a lit meshStandardMaterial under
	// this scene's ambient + directional + studio-environment lighting washed
	// the art out. foilMaterial is a fully custom shader (no scene-light
	// uniforms), so it's unaffected either way.
	return treatment !== "standard" ? (
		<primitive
			object={foilMaterial}
			attach="material"
			depthTest={!alwaysOnTop}
			depthWrite={!alwaysOnTop}
		/>
	) : (
		<meshBasicMaterial
			map={texture}
			alphaTest={0.5}
			depthTest={!alwaysOnTop}
			depthWrite={!alwaysOnTop}
		/>
	);
}

/** A real FAB card's own image already is the full rendered card face — no
 * canvas frame-drawing needed, just load it as a texture (preloaded ahead
 * of time by the store when a pack opens, see stores/pack-opener.ts, so
 * this shouldn't actually suspend mid-reveal). Uses useSafeTexture rather
 * than drei's Suspense-based useTexture — see that hook's own comment for
 * why: not every printing's art actually exists on the image host, and
 * that specific failure can't be caught by a React error boundary, so it
 * has to be handled at the loader level instead. Falls back to the mock
 * canvas-drawn face for just this one card rather than crashing the scene. */
function RealCardFace({
	card,
	imageUrl,
	fallbackImageUrl,
	lightDirRef,
	alwaysOnTop,
}: {
	card: ResolvedCard;
	imageUrl: string;
	/** Tried if `imageUrl` 404s, before giving up and drawing the mock face.
	 * Used for the other side of a double-faced card: the image host is
	 * missing exactly one of the 106 back-face images this app can ask for
	 * (verified by fetching all of them), and showing the card's own front
	 * again is a far better answer there than a placeholder that looks
	 * nothing like the card. Deliberately not recursive beyond one step. */
	fallbackImageUrl?: string | null;
	lightDirRef: LightDirRef;
	alwaysOnTop: boolean;
}) {
	const state = useSafeTexture(imageUrl);
	// The stand-in shown while the real art loads. Loaded here rather than
	// in a separate component on purpose — see below.
	const placeholder = useSafeTexture(CARD_BACK_URL);

	if (state.status === "error") {
		if (fallbackImageUrl) {
			return (
				<RealCardFace
					card={card}
					imageUrl={fallbackImageUrl}
					lightDirRef={lightDirRef}
					alwaysOnTop={alwaysOnTop}
				/>
			);
		}
		return (
			<MockCardFace
				card={card}
				lightDirRef={lightDirRef}
				alwaysOnTop={alwaysOnTop}
			/>
		);
	}

	/**
	 * ONE material element, whose texture changes. Never two alternatives
	 * swapped for each other.
	 *
	 * This used to return a separate <CardBackFace> component while
	 * loading and <CardFaceMaterial> once loaded. Both of those render a
	 * material, so React saw two different component types in the same
	 * child position and did an unmount-plus-mount rather than a prop
	 * update. A material is attached to its parent mesh imperatively
	 * (r3f's `attach`, which also restores the previous material on
	 * unmount), and across that swap the mesh kept the OLD material: the
	 * card back stayed on screen permanently, even though the real
	 * texture had downloaded and the component had re-rendered.
	 *
	 * Measured, not theorised: on a fresh page, turning over a
	 * double-faced card fetched the back image in 233ms and then showed
	 * the card-back stand-in indefinitely — still there 20 seconds later.
	 * Turning to the front and back again fixed it, because by then the
	 * texture was cached and the loading branch never ran. That is exactly
	 * the bug report.
	 *
	 * `treatment` deliberately reads from the card, not from whether the
	 * art has arrived, so the material TYPE (plain vs. the foil shader,
	 * see CardFaceMaterial) is fixed for the life of a card and the
	 * arriving texture is only ever a prop change.
	 */
	const texture =
		state.status === "loaded"
			? state.texture
			: placeholder.status === "loaded"
				? placeholder.texture
				: null;
	// Only before the locally-bundled card back has itself loaded, which
	// the route loader warms long before any pack is opened.
	if (texture === null) return null;
	return (
		<CardFaceMaterial
			texture={texture}
			treatment={card.treatment}
			isMarvel={card.rarity === "marvel"}
			lightDirRef={lightDirRef}
			alwaysOnTop={alwaysOnTop}
		/>
	);
}

/** Fallback when a card has no real image (dataset unavailable) — the
 * canvas-drawn placeholder frame. */
function MockCardFace({
	card,
	lightDirRef,
	alwaysOnTop,
}: {
	card: ResolvedCard;
	lightDirRef: LightDirRef;
	alwaysOnTop: boolean;
}) {
	const texture = useCardTexture(card);
	return (
		<CardFaceMaterial
			texture={texture}
			treatment={card.treatment}
			isMarvel={card.rarity === "marvel"}
			lightDirRef={lightDirRef}
			alwaysOnTop={alwaysOnTop}
		/>
	);
}

interface Card3DProps {
	card: ResolvedCard;
	onClick?: () => void;
	/** False for the outgoing (sliding-away) card in OutgoingCard.tsx — not
	 * interactive, so it tracks no pointer and stays flat/at-rest. Tilt
	 * lives entirely inside this component (the group below); the reveal
	 * slide stays on OutgoingCard's own separate group, per the execution
	 * plan section 5.3 — the two never touch the same transform. */
	interactive?: boolean;
	/** True only for the outgoing (sliding-away) card in OutgoingCard.tsx —
	 * see the execution plan, section 2.2. The card underneath tilts with
	 * the pointer (up to CARD_TILT_MAX_DEG), which at the corners swings it
	 * geometrically past the ~0.03-unit gap OutgoingCard's z offset leaves
	 * between the two cards, so the active card can poke through the
	 * outgoing one mid-slide. Disabling depth testing/writing on the
	 * outgoing card's material and raising its renderOrder makes it always
	 * paint on top regardless of the actual geometry, which is safe here
	 * because only these two cards are ever in the scene during a reveal
	 * (PackMesh is unmounted then — see PackOpenerCanvas.tsx). */
	alwaysOnTop?: boolean;
	/** Show the other side of a double-faced card instead of its front (see
	 * the store's showingOtherFace, and card-resolver.ts's backImageUrl).
	 * Ignored for the great majority of cards, which have only one face.
	 *
	 * This swaps the texture; it does not rotate the card. Cards in this
	 * scene never rotate as part of a reveal (see this app's CLAUDE.md,
	 * which records that a rotation-based design was removed on explicit
	 * feedback), and a player asking to read the other side wants to read
	 * it, not watch it spin. */
	showOtherFace?: boolean;
}

/** A single face-up card. Always static in place — no flip, no rotation as
 * part of the reveal. What DOES rotate here is the tilt: pointer position
 * over the canvas maps to a small tilt on this group (section 3.4), which
 * also drives the foil shader's light direction (section 3.3) so the two
 * are one piece of work, not two. Reveals still happen by sliding the
 * previous card away (see OutgoingCard), never by turning this one over. */
export function Card3D({
	card,
	onClick,
	interactive = true,
	alwaysOnTop = false,
	showOtherFace = false,
}: Card3DProps) {
	const group = useRef<Group>(null);
	const lightDir = useRef({ x: 0, y: 0 });
	const reducedMotion = usePrefersReducedMotion();
	// Falls back to the front whenever there is no other face to show, so a
	// stale flip can never blank a single-faced card.
	const faceUrl =
		showOtherFace && card.backImageUrl !== null
			? card.backImageUrl
			: card.imageUrl;

	useFrame((state) => {
		if (reducedMotion) {
			lightDir.current.x = REDUCED_MOTION_LIGHT_DIR.x;
			lightDir.current.y = REDUCED_MOTION_LIGHT_DIR.y;
		} else {
			const targetX = interactive
				? Math.max(-1, Math.min(1, state.pointer.x))
				: 0;
			const targetY = interactive
				? Math.max(-1, Math.min(1, state.pointer.y))
				: 0;
			lightDir.current.x += (targetX - lightDir.current.x) * CARD_TILT_EASE;
			lightDir.current.y += (targetY - lightDir.current.y) * CARD_TILT_EASE;
		}

		if (!group.current) return;
		if (reducedMotion) {
			group.current.rotation.x = 0;
			group.current.rotation.y = 0;
		} else {
			// Tipping the card's near-right edge away from a pointer on the
			// right (and its top edge away from a pointer above) is what
			// reads as "tilting it under a lamp" rather than fighting the
			// pointer — verified on screen, not just by sign algebra.
			group.current.rotation.x = -lightDir.current.y * MAX_TILT_RAD;
			group.current.rotation.y = lightDir.current.x * MAX_TILT_RAD;
		}
	});

	return (
		<group ref={group}>
			<mesh onClick={onClick} renderOrder={alwaysOnTop ? 1 : 0}>
				<planeGeometry args={[CARD_WIDTH, CARD_HEIGHT]} />
				{faceUrl !== null ? (
					<RealCardFace
						card={card}
						imageUrl={faceUrl}
						fallbackImageUrl={faceUrl === card.imageUrl ? null : card.imageUrl}
						lightDirRef={lightDir}
						alwaysOnTop={alwaysOnTop}
					/>
				) : (
					<MockCardFace
						card={card}
						lightDirRef={lightDir}
						alwaysOnTop={alwaysOnTop}
					/>
				)}
			</mesh>
		</group>
	);
}
