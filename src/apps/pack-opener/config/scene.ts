// Pack mesh proportions (world units), roughly 1:2 width:height. Shared by
// PackMesh.tsx and textures/pack-art-strips.ts.
export const PACK_WIDTH = 1.05;
export const PACK_HEIGHT = 2.0;
export type PackPart = "body" | "seal";
/** Height of the tear-off seal strip; its share of PACK_HEIGHT is the top
 * fraction of pack art cut as the seal (pack-art-strips.ts). */
export const PACK_SEAL_HEIGHT = 0.236;

export const CARD_WIDTH = 1.2;
export const CARD_HEIGHT = CARD_WIDTH * (628 / 450);

/** The official card back, self-hosted so the loading placeholder works
 * offline (precached by the service worker). */
export const CARD_BACK_URL = "/img/pack-opener/card-back.webp";

/** Card tilt: pointer position maps to a tilt of at most this many degrees on
 * each axis, eased toward its target each frame rather than snapping
 * (CARD_TILT_EASE is a lerp factor, a cheap spring approximation, not a real
 * spring model). */
export const CARD_TILT_MAX_DEG = 12;
export const CARD_TILT_EASE = 0.12;
/** The same gesture on the closed pack (see PackMesh.tsx). Smaller than the
 * card's: the pack is a tall box rather than a flat plane, so the same
 * angle swings its edges much further and starts to read as the whole pack
 * swivelling rather than catching the light. */
export const PACK_TILT_MAX_DEG = 8;

/** Minimum drag, in pixels, before a touch gesture counts as a swipe rather
 * than a tap. Shared by the set carousel (horizontal) and the pack summary
 * (vertical) so the two gestures need the same commitment from the player;
 * they had the same number written out separately, which is exactly how two
 * gestures end up feeling different for no reason. */
export const SWIPE_THRESHOLD_PX = 40;

/** How far behind the card celebration effects sit. Additive effects (glow,
 * sparkles, fireworks) draw in the transparent queue after the opaque card
 * whatever their renderOrder, so they must clear the card's tilt excursion
 * (~0.30 units at CARD_TILT_MAX_DEG) or they paint over it. Effects layer
 * further back from here. */
export const CELEBRATION_Z = -0.55;

/** Pause with the pack closed before the seal moves, so the camera arrives first. */
export const TEAR_START_DELAY_MS = 420;
export const TEAR_DURATION_MS = 1200;
/** Extra pause after the tear animation finishes before the first card arrives. */
export const TEAR_TAIL_MS = 300;
/** How long the just-revealed card takes to slide up and off, exposing the
 * next card underneath — like pulling the top card off a physical stack.
 * The revealed card itself never rotates; only the outgoing one moves. */
export const REVEAL_TRANSITION_MS = 320;
/** How far (world units) the outgoing card slides upward — comfortably more
 * than the reveal-phase vertical frustum so it fully clears the frame. */
export const CARD_SLIDE_DISTANCE = 2.6;
/** How long the first card takes to settle in. A scale/depth move, not an
 * opacity fade, to stay in the opaque queue (see CELEBRATION_Z). */
export const REVEAL_INTRO_MS = 260;
/** Scale the first card grows from over REVEAL_INTRO_MS. Close to 1 on
 * purpose: this should read as the card settling into place, not as it
 * zooming in. */
export const REVEAL_INTRO_START_SCALE = 0.9;
/** How far back (world units) the first card starts before easing forward
 * to its resting z over REVEAL_INTRO_MS. */
export const REVEAL_INTRO_START_Z = -0.45;
/** Minimum gap between two advanceReveal() calls — guards against a single
 * tap/click firing twice, not against spamming through the pack. A player
 * can tap faster than REVEAL_TRANSITION_MS to skip through reveals quickly;
 * each new card just appears in place, no wait required. */
export const ADVANCE_DEBOUNCE_MS = 120;
/** How long the last card stays before the summary appears on its own; a tap skips the wait. */
export const LAST_CARD_AUTO_SUMMARY_MS = 2600;
/** How long PullCelebration.tsx's glow takes to bloom in to its resting
 * size/opacity once a celebrated card becomes active — see
 * cards/celebration-tier.ts for which pulls celebrate. It starts together with
 * REVEAL_TRANSITION_MS's slide, off the same timestamp, and runs on past it so
 * the glow is still settling as the card comes to rest. */
export const GLOW_ANIMATION_MS = 900;

// Camera distances frame each phase's subject at a similar share of the
// frustum: H(d) = 2 * d * tan(fov/2) at fov 35. The pack (2.0 tall) needs more
// distance than a card (CARD_HEIGHT ~1.675). Idle sits further out than
// tearing so tapping gives a gentle push-in.
export const IDLE_CAMERA_POSITION: [number, number, number] = [0, 0, 3.45];
export const TEARING_CAMERA_POSITION: [number, number, number] = [0, 0, 3.35];
/** Close enough that the card fills most of its canvas. */
export const REVEALING_CAMERA_POSITION: [number, number, number] = [0, 0, 2.8];
/** Identical to REVEALING_CAMERA_POSITION so a card is one size all session. */
export const DONE_CAMERA_POSITION: [number, number, number] = [0, 0, 2.8];
