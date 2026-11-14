# Pack Opener App

A 3D booster-pack-opening simulator (react-three-fiber): tear a pack open, then pull the
cards off the stack one by one. Cards are real Flesh and Blood printings.

## Structure

```
src/apps/pack-opener/
  pack/       Pure odds and generation, no React or three.js. published-rates.ts holds every
              rate (tagged PUBLISHED, OBSERVED, ESTIMATED or POPULATION), set-configs.ts turns
              them into each set's PackConfig, generate-pack.ts deals, reveal-order.ts orders
  cards/      card-resolver.ts (drawn card -> real printing), celebration-tier.ts
  stats/      Session stats and value totals. Pure.
  lib/        currency, pricing, easing, pack-art, preload-pack, set-index, texture-cache
  hooks/      usePrices, useSafeTexture, useCardFaceTexture, useSetNavigation, ...
  stores/     pack-opener.ts: the Zustand store; pack-opener-types.ts
  components/
    PackOpenerPage, PackOpenerLoading, PackOpenerUnavailable, shared dialogs and price bits
    carousel/ The set picker and the set info dialog
    hud/      2D chrome below the canvas (caption, summary, ledger, session controls).
              CardLoadingIndicator is the one overlay on the canvas
    scene/    react-three-fiber scene: canvas, camera, pack, cards, celebration effects,
              materials/foilMaterial.ts, textures/
  config/     scene.ts (timing, sizes, CELEBRATION_Z), celebration.ts, known-sets.ts
  i18n/en.json  Namespace "pack-opener", including its own card.rarity.* labels
```

## State machine

`idle -> tearing -> revealing(index) -> done`, owned by `stores/pack-opener.ts`. The store's
`phaseStartedAt` is the single source of animation timing: every `useFrame` timer reads it,
and 3D components and the HUD are pure readers. `openPack()` waits for the set's printings
if they aren't cached yet, so every surface resolves the same cards. Switching set or
resetting cancels that wait. The selected set, currency and beta notice dismissal are saved with the store's
persist middleware, never through localStorage directly.

## Rendering rules

- Cards never flip or rotate. `OutgoingCard` slides the previous card up and off, exposing
  the active card beneath.
- Nothing is lit: no lights, no `<Environment>`. Card art must read true to source. Only the
  cold foil responds to the tilt, through its own shader (`materials/foilMaterial.ts`; read
  its header before changing it).
- three.js draws transparent materials after opaque ones whatever `renderOrder` says. The
  card is opaque and the celebration effects are additive, so anything additive must stay
  behind `CELEBRATION_Z` in `config/scene.ts`.

## Bundle

three.js, fiber and drei must not load for visitors who never open this app. `index.ts` imports
the store on demand and the route loader imports `lib/texture-cache.ts` dynamically, so
anything reachable from those must not statically import the scene or store. `config/scene.ts`
has no imports for this reason. `PackOpenerLoading` and `PackOpenerUnavailable` render from the
entry chunk under the same rule.

The service worker precache excludes this app's chunks (`globIgnores` in `vite.config.ts`) and
pack art (`scripts/update-pwa-assets.ts`); only the card back is precached. `runtimeCaching`
stores the rest after a first visit.

## Card data

- `src/shared/data/fab-printings.ts` fetches one JSON file per set from
  `public/data/pack-opener/sets/`, built by `scripts/build-pack-data.ts` from the-fab-cube's
  develop branch. Run `bun run build-pack-data` first; tests that need it skip without it.
- A double-faced card is one row; its other face is `backImageUrl`, reached via the flip control.
- `scripts/pre-release-bridge.ts` ships sets the-fab-cube hasn't picked up yet and retires
  itself once the-fab-cube's data overtakes it.
- `resolveCard` picks the printing deterministically per drawn card id (`hashToIndex`). The
  printing wins over the draw where they disagree (see `resolveTreatment`). A Cold Foil
  upgrade redraws from the set's real cold printings, so counting pulls must use the
  resolved rarity. Missing set data resolves to a placeholder card.
- Every image texture goes through `lib/texture-cache.ts`, never drei's `useTexture`, because
  a 404 there throws outside React and takes the route down. It reports failure instead, so
  `CardFace` can fall back from the face, to the front, to the card back.

## Odds

All rates live in `pack/published-rates.ts`; `tests/pack-opener/calibration.test.ts`
simulates 200,000 packs per set and asserts each published rate within 20%, so change a rate
and its transcription together. `tests/pack-opener/pool-viability.test.ts` checks every slot
can be dealt. Fabled is estimated at half a set's Marvel rate where unpublished.

## Prices

USD is TCGplayer (`shared/data/fab-prices.ts`), EUR is Cardmarket
(`shared/data/fab-prices-cm.ts`), never converted into each other. Both are build-time
snapshots refreshed nightly by `pages.yml`. Go through `lib/pricing.ts` via `usePrices`. A
missing price shows "Not priced yet", never zero or the other currency.

## Decided, don't reopen

- **Own foil shaders, never `-RF`/`-CF` art slugs.** LSS's foil art has the foil printed in and
  fabrary serves the base image for those slugs anyway.
- **Smaller card images are a dead end.** The only smaller copies lack CORS headers, so WebGL
  can't use them, and self-hosting would mean hundreds of MB.

## Import rules

Import from `@fabkit/platform/*` and `@fabkit/shared/*` only, never from other apps. The route
file is `src/routes/pack-opener.tsx`.
