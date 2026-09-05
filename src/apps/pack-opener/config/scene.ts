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

// Camera distances are chosen so the framed object fills ~80% of the vertical
// frustum at the Canvas's fov (35°) — big and centered, but never cropped.
// H(d) = 2 * d * tan(fov/2); solved for d given each phase's object height
// (pack closed ~2.15 units tall, single card CARD_HEIGHT ~1.675 units).
export const IDLE_CAMERA_POSITION: [number, number, number] = [0, 0.3, 4.3];
export const TEARING_CAMERA_POSITION: [number, number, number] = [0, 0.15, 3.5];
export const REVEALING_CAMERA_POSITION: [number, number, number] = [0, 0, 3.2];
export const DONE_CAMERA_POSITION: [number, number, number] = [0, 0.45, 5];

/** Extra camera push-in applied on top of REVEALING_CAMERA_POSITION for a
 * bigger dolly-in punch when the active card is rare-or-better. Capped well
 * below REVEALING_CAMERA_POSITION's z so even the biggest punch (marvel/foil)
 * keeps the full card in frame instead of cropping it. */
export const CAMERA_PUNCH_BY_SLOT: Record<string, number> = {
	common: 0,
	"basic-or-token": 0,
	"guaranteed-rare-plus": 0.25,
	"premium-foil": 0.45,
};
