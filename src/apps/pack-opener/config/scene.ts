// Pack mesh proportions (world units) — matches real FAB pack proportions,
// roughly 1:2 width:height. Shared between PackMesh.tsx (the actual
// boxGeometry dimensions) and textures/useRealPackTexture.ts (which derives
// the seal/body split fraction of an uploaded pack image from these same
// numbers) so the two can never drift apart and shear the art at the tear
// line — see the execution plan, section 5.3.
export const PACK_WIDTH = 1.05;
export const PACK_HEIGHT = 2.0;
/** Height of the tear-off seal strip, in the same world units as
 * PACK_HEIGHT. Its share of PACK_HEIGHT (0.236 / 2.0 = 11.8%) is also the
 * top fraction of an uploaded pack-front image that gets cut away as the
 * seal texture — see useRealPackTexture.ts's SEAL_FRACTION.
 *
 * Measured off a real pack front rather than guessed: on Legend Story
 * Studios' own product shots the crimped foil strip runs from the top edge
 * down to about 9% of the image, then a shadowed gap, and the pack face's
 * gold trim line starts at 11.8%. Tearing anywhere above that leaves a
 * band of crimp stuck to the body. If a future set's art crimps
 * differently, this one number is the thing to re-measure. */
export const PACK_SEAL_HEIGHT = 0.236;

/** Card tilt (see the execution plan, section 3.4) — pointer position maps
 * to a tilt of at most this many degrees on each axis, eased toward its
 * target each frame rather than snapping (TILT_EASE is a lerp factor, a
 * cheap spring approximation, not a real spring model). */
export const CARD_TILT_MAX_DEG = 12;
/** The same gesture on the closed pack (see PackMesh.tsx). Smaller than the
 * card's: the pack is a tall box rather than a flat plane, so the same
 * angle swings its edges much further and starts to read as the whole pack
 * swivelling rather than catching the light. */
export const PACK_TILT_MAX_DEG = 8;
export const CARD_TILT_EASE = 0.12;

/** A beat where the pack sits closed before the seal starts moving. The
 * tear used to begin the instant openPack() fired, which meant it played
 * out while the camera was still swinging in from wherever the previous
 * phase left it — the rip was over before the shot had settled, and on
 * "Open Another Pack" it read as though the animation had been skipped
 * entirely (it hadn't; measured, the state machine ran the full tear every
 * time). Holding first gives the camera time to arrive and makes the rip a
 * deliberate, visible event rather than something happening under a
 * moving camera. */
export const TEAR_START_DELAY_MS = 420;
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
/** How long the first card takes to settle in after the pack tears open.
 * Without it the pack vanishes and the card is simply *there* on the very
 * next frame, which reads as a hard cut. This is deliberately a scale/depth
 * move rather than an opacity fade: the card materials use a hard alpha
 * cutout so they stay in the opaque render queue, and fading them would
 * push them into the transparent queue, which paints after everything
 * opaque regardless of render order — the exact thing that caused the glow
 * plane to paint over the card (see PullCelebration.tsx). */
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
/** How long the last card of a pack stays on screen before the summary
 * appears on its own. Reaching the final card used to need one more tap
 * that revealed nothing new — the card was already showing, so the tap
 * only dismissed it. Long enough to actually look at what is usually the
 * pack's best card, short enough not to feel stuck. Tapping still works
 * and skips the wait. */
export const LAST_CARD_AUTO_SUMMARY_MS = 2600;
/** How long PullCelebration.tsx's glow takes to bloom in to its resting
 * size/opacity once a celebrated card becomes active — see
 * cards/celebration-tier.ts for which pulls celebrate. Deliberately close
 * to REVEAL_TRANSITION_MS so the glow reads as arriving with the card, not
 * as a separate, later event. */
export const GLOW_ANIMATION_MS = 900;

// Camera distances frame each phase's subject at a similar share of the
// vertical frustum, so nothing changes apparent size as the phases move on.
// H(d) = 2 * d * tan(fov/2) at the Canvas's 35° fov; solved for d given each
// subject's height (pack 2.0 units, single card CARD_HEIGHT ~1.675). The pack
// being the taller object is why it needs the greater distance: framed from
// the same spot as a card it would loom noticeably larger than the cards it
// produces. Both the pack and the cards now fill most of their own canvas
// (~92% and ~95%), because everything else on the page takes a fixed
// amount of room and whatever is left IS the subject's space — it should
// use nearly all of it. The pack's canvas is the taller of the two (no
// summary is reserved beneath it while the pack is on screen), so the same
// share leaves it a little larger than a card, which is about right for a
// thing that contains cards. Idle sits slightly further out than tearing
// so tapping still gives a gentle push-in.
export const IDLE_CAMERA_POSITION: [number, number, number] = [0, 0, 3.45];
export const TEARING_CAMERA_POSITION: [number, number, number] = [0, 0, 3.35];
/** Close enough that the card fills most of its canvas. Everything that
 * shares the page with it (set picker above, card details and summary
 * below) now takes its own fixed space, so the canvas is exactly the room
 * the card gets and it should use nearly all of it — a wide empty band
 * between the card and the set picker was the specific complaint. */
export const REVEALING_CAMERA_POSITION: [number, number, number] = [0, 0, 2.8];
/** Deliberately identical to REVEALING_CAMERA_POSITION. It used to pull
 * back to [0, 0.45, 5] to clear room for the summary panel, which meant
 * the last card of a pack visibly shrank as the summary arrived, and every
 * card revisited from the summary ledger showed up smaller than it had
 * during the reveal. A card should be exactly one size for the whole
 * session; the summary collapsing (see PackSummary.tsx) is what makes room
 * now, not the camera. */
export const DONE_CAMERA_POSITION: [number, number, number] = [0, 0, 2.8];

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
/** The card sits dead centre in the canvas in every phase. It briefly had a
 * separate, raised position for the done phase, back when the summary was
 * an overlay floating over the bottom of the canvas and the card had to
 * climb out from under it. The summary now takes its own space in the page
 * below the canvas (see PackOpenerPage.tsx), so there is nothing left to
 * dodge and one centred position serves every phase. */
export const CARD_Y_OFFSET = 0;
