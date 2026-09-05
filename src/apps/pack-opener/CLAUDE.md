# Pack Opener App

A 3D booster-pack-opening simulator (react-three-fiber): tear open a pack, then pull
all 16 cards off the stack one by one. Cards show real Flesh and Blood card images —
see "Card data" below — with a placeholder-drawn fallback if the real dataset can't load.

## Structure

```
src/apps/pack-opener/
  pack/              Pure odds/generation logic, no React or three.js
    types.ts         PackSlotSpec, PackConfig, DrawnCard, RarityWeight
    rng.ts           mulberry32 — seeded PRNG for deterministic tests
    odds.ts          DEFAULT_PACK_CONFIG + named constants, per-set lookup via getPackConfig()
    generate-pack.ts generatePack(config, rng?) — weighted slot draws + cold foil/marvel rolls
    reveal-order.ts  orderForReveal() — shuffles reveal order, pins the premium-foil card last
  cards/             Card content resolution
    deterministic-hash.ts hashToIndex() — stable per-id pick into a pool, shared by the
                      mock name/pitch generator and the real-card resolver's pool selection
    mock-card.ts     resolveMockCard() — deterministic placeholder flavor names by rarity
    card-resolver.ts ResolvedCard type (mirrors FabbleCard's shape) + CardResolver interface;
                      fabDatasetCardResolver (real data, see "Card data" below) is
                      activeCardResolver — the swap point, in case that ever needs to change
    rarity-icon-cache.ts  Preloads the 10 shared rarity SVGs once (called from the route loader)
    mock-card-texture.ts  drawMockCardFace() — canvas-drawn FAB-style placeholder card face,
                      used only by the mock-fallback rendering path (see "Card data")
  stores/pack-opener.ts   Zustand store — the idle/tearing/revealing/done state machine
  components/
    scene/           react-three-fiber scene: PackOpenerCanvas, CameraRig (scripted, no
                      OrbitControls), PackMesh (top-seal tear animation), TearBurst,
                      CardStack3D (composes the active + outgoing card below), Card3D
                      (static face-up card; branches real-image vs. mock-canvas rendering,
                      unlit material — see "Rendering" — foil material swap, never
                      rotates), OutgoingCard (the actual reveal: slides the previous card
                      up and off, exposing the active one underneath — see "Reveal
                      mechanic" below), materials/foilMaterial.ts (holographic shader),
                      textures/useCardTexture.ts (the only place a THREE.CanvasTexture is
                      constructed — real card images load via drei's useTexture instead,
                      see "Card data")
    hud/             2D overlay UI (IdleOverlay, RevealBadge, PackSummary) composed by
                      PackOpenerHUD, driven purely by store state
  config/scene.ts     Animation durations, easing, camera targets/punch-per-slot
  i18n/en.json        Namespace "pack-opener" — carries its own card.rarity.* block since
                      rarity labels are per-app translations, not centrally shared (see
                      card-creator's i18n for the same pattern)
```

## State machine

`idle -> tearing -> revealing(index) -> done`, owned entirely by `stores/pack-opener.ts`.
The store is the sole source of truth for animation timing (`phaseStartedAt` — every
`useFrame` timer in the scene reads off this single timestamp); 3D components and the HUD
are pure readers, never independent timers. `openPack()` generates + orders a new pack and
schedules the tear-to-reveal transition itself; `advanceReveal()` only debounces against a
single tap firing twice (`ADVANCE_DEBOUNCE_MS`, ~120ms) — there's no wait for an animation
to finish, so tapping fast skips through the pack quickly.

## Reveal mechanic

Cards never flip or rotate. The active card (`Card3D`, in `CardStack3D.tsx`) is always
rendered face-up and static; the "reveal" is `OutgoingCard` sliding the *previous* card
up and off (timed off the same `phaseStartedAt`), exposing the already-in-place active
card underneath — like pulling the top card off a physical stack, not turning one over.
Nothing else renders beneath the active card — an earlier version added a thin peek of
the next/final card's back there, but that (and, before it, a decorative "remaining
cards" box stack matching the active card's exact size) was removed on explicit
feedback: no peek at all, just the card itself. This also replaced an even earlier
rotation-based flip design (feedback: it should feel like sliding a real card off a
stack, not spinning one in place).

## Rendering

The card face's material is deliberately unlit (`meshBasicMaterial`, not
`meshStandardMaterial`) — a card's image is meant to read true-to-source, like a photo,
not as a physically-lit 3D object. Running real card art through this scene's ambient +
directional + studio-environment lighting washed the colors out. `foilMaterial` (the
holographic shader for foil/Marvel cards) was never affected by this — it's a fully
custom shader that samples the base texture directly and never consumes scene-light
uniforms, so it already behaved as effectively unlit.

## Card data

Cards are real Flesh and Blood cards, sourced from the same public dataset the Fabble
app consumes (github.com/FABKIT/fabble-data). Since apps can't import each other,
`src/shared/data/fab-card-dataset.ts` fetches and parses it independently of Fabble's
own `load-dataset.ts` — a slim `FabCard` type (id/name/rarity/imageUrl/pitch/cost/
power/defense) rather than the full `FabbleCard` shape, grouped by rarity for
`getFabCardsByRarity()`. The route loader (`src/routes/pack-opener.tsx`) awaits
`loadFabCardDataset()` up front, same as the rarity-icon preload.

`fabDatasetCardResolver` (`cards/card-resolver.ts`) picks a real card from the drawn
rarity's pool, deterministically per drawn-card id (`hashToIndex`) so re-renders don't
reshuffle which card a slot shows. The dataset has no cards of rarity "token" or
"marvel" (tokens aren't guessable trivia answers in the source game; Marvel is a foil
treatment on an existing card, not its own rarity) — `substituteRarityFor()` redirects
those draws to "basic" and "legendary" pools respectively, so those slots still show a
real card rather than falling back to mock art. If the dataset never loaded (or a pool
is somehow still empty), `fabDatasetCardResolver` falls back to `mockCardResolver`
per-draw rather than crashing.

A real card's own image already IS the fully rendered card face — Card3D's
`RealCardFace` loads it directly via drei's `useTexture` (Suspense-based, cached by
URL), no canvas frame-drawing needed. `MockCardFace` (the `drawMockCardFace` canvas
pipeline) only runs for cards that came back from the mock fallback. `stores/pack-opener.ts`'s
`openPack()` preloads every card's image via `useTexture.preload()` right when the pack
is generated, so by the time each card becomes active during the ~1.5s tear animation
its texture is normally already cached and doesn't suspend mid-reveal.

CORS note: `content.fabrary.net` (the image host) only returns
`Access-Control-Allow-Origin` when a request actually carries an `Origin` header — a
bare `curl` without one won't show it, which looked like a dealbreaker until verified
with `curl -H "Origin: ..."`. Three.js's loaders default `crossOrigin` to `"anonymous"`,
so this works with zero extra configuration.

## Odds

Modeled on real FAB booster structure (16 cards: 12 common, 1 guaranteed rare-plus, 1
guaranteed-foil premium slot, 2 basic/token), with cold foil (~1/22) and Marvel (~1/2000)
as separately-rolled long-tail upgrades. See `pack/odds.ts` for the sourcing notes — cold
foil and Marvel rates are community estimates, not published LSS numbers, and are
deliberately configurable per `PackConfig.id` via `getPackConfig()` rather than hardcoded,
since real sets vary slot mechanics.

## Import Rules

Same as every app: import from `@fabkit/platform/*` and `@fabkit/shared/*` only, never from
other apps. Route file is `src/routes/pack-opener.tsx`.
