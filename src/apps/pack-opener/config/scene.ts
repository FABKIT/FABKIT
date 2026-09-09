// Pack mesh proportions (world units) — matches real FAB pack proportions,
// roughly 1:2 width:height. Shared between PackMesh.tsx (the actual
// boxGeometry dimensions) and textures/useRealPackTexture.ts (which derives
// the seal/body split fraction of an uploaded pack image from these same
// numbers) so the two can never drift apart and shear the art at the tear
// line — see the execution plan, section 5.3.
export const PACK_WIDTH = 1.05;
export const PACK_HEIGHT = 2.0;
/** The seal strip's share of PACK_HEIGHT — also the top fraction of an
 * uploaded pack-front image that becomes the tear-off seal texture. */
export const PACK_SEAL_HEIGHT = 0.16;

/** Card tilt (see the execution plan, section 3.4) — pointer position maps
 * to a tilt of at most this many degrees on each axis, eased toward its
 * target each frame rather than snapping (TILT_EASE is a lerp factor, a
 * cheap spring approximation, not a real spring model). */
export const CARD_TILT_MAX_DEG = 12;
export const CARD_TILT_EASE = 0.12;

export const TEAR_DURATION_MS = 1200;
/** Extra pause after the tear animation finishes before the first card's flip starts. */
export const TEAR_TAIL_MS = 300;
/** How long the just-revealed card takes to slide up and off, exposing the
 * next card underneath — like pulling the top card off a physical stack.
 * The revealed card itself never rotates; only the outgoing one moves. */
export const REVEAL_TRANSITION_MS = 320;
/** How far (world units) the outgoing card slides upward — comfortably more
 * than the reveal-phase vertical frustum so it fully clears the frame. */
export const CARD_SLIDE_DISTANCE = 2.6;
/** Minimum gap between two advanceReveal() calls — guards against a single
 * tap/click firing twice, not against spamming through the pack. A player
 * can tap faster than REVEAL_TRANSITION_MS to skip through reveals quickly;
 * each new card just appears in place, no wait required. */
export const ADVANCE_DEBOUNCE_MS = 120;
/** How long PullCelebration.tsx's glow takes to bloom in to its resting
 * size/opacity once a celebrated card becomes active — see
 * cards/celebration-tier.ts for which pulls celebrate. Deliberately close
 * to REVEAL_TRANSITION_MS so the glow reads as arriving with the card, not
 * as a separate, later event. */
export const GLOW_ANIMATION_MS = 900;

// Camera distances are chosen so the framed object fills ~80% of the vertical
// frustum at the Canvas's fov (35°) — big and centered, but never cropped.
// H(d) = 2 * d * tan(fov/2); solved for d given each phase's object height
// (pack closed ~2.15 units tall, single card CARD_HEIGHT ~1.675 units).
export const IDLE_CAMERA_POSITION: [number, number, number] = [0, 0.3, 4.3];
export const TEARING_CAMERA_POSITION: [number, number, number] = [0, 0.15, 3.5];
/** z pulled back from 3.2 (see the execution plan, section 2.3) — Louis's
 * feedback was the opposite of what it sounds like at first: the revealed
 * card itself was too big/dominant on screen, not too small. A farther
 * camera makes the card a smaller share of the (now taller, at this fov)
 * frame — see the H(d) formula above. This alone opens up MORE empty
 * margin around the card, not less; REVEALING_CARD_Y_OFFSET below is what
 * actually closes the specific gap Louis flagged, between the card and
 * RevealCaption underneath it. */
export const REVEALING_CAMERA_POSITION: [number, number, number] = [0, 0, 3.6];
export const DONE_CAMERA_POSITION: [number, number, number] = [0, 0.45, 5];

/**
 * A camera position always looks at the world origin (see CameraRig.tsx's
 * camera.lookAt(0, 0, 0)), so moving the camera's own Y does not move a
 * subject sitting at the origin on screen — it only tilts the viewing
 * angle, which would make a flat card plane read as subtly foreshortened.
 * To actually shift the revealed card lower in frame (closing the gap
 * between it and RevealCaption below the canvas — the execution plan,
 * section 2.3), CardStack3D.tsx offsets the CARD ITSELF by this amount
 * instead of moving the camera. Negative Y = down. Modest on purpose: the
 * card must stay fully inside the vertical frustum at every tilt angle. */
export const REVEALING_CARD_Y_OFFSET = -0.18;
