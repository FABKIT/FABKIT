# Pack Opener App

A 3D booster-pack-opening simulator (react-three-fiber): tear open a pack, then pull every
card off the stack one by one. How many depends on the product (`cardsPerPack`, 2 to 16).
Cards show real Flesh and Blood card images, see "Card data" below.

## Structure

```
src/apps/pack-opener/
  pack/              Pure odds/generation logic, no React or three.js
    types.ts         PackSlotSpec, PackConfig, DrawnCard, RarityWeight
    published-rates.ts  Every rate that decides what a pack deals, hand-editable, each tagged
                      PUBLISHED, OBSERVED, ESTIMATED or POPULATION
    set-configs.ts   Turns those rates into each set's PackConfig
    odds.ts          DEFAULT_PACK_CONFIG (mock, used when no set applies, and by tests) and
                      getPackConfig()
    generate-pack.ts generatePack(config, rng?): weighted slot draws, then Cold Foil, Marvel
                      and Fabled rolls
    reveal-order.ts  orderForReveal(): shuffles reveal order, pins the premium foil last
    slot-table.ts, pull-rates.ts  What a pack holds, for the set info dialog
    rng.ts           mulberry32, a seeded PRNG for deterministic tests
  cards/
    card-resolver.ts ResolvedCard, and resolveCard (per-set printings, with a
                      placeholder when a set's data is missing)
    celebration-tier.ts  Which rarities get which celebration
    deterministic-hash.ts  hashToIndex(): a stable per-id pick into a pool
  stats/             computeSessionStats, value totals. Pure, no React.
  lib/               currency.ts, pricing.ts (see "Prices and currency"), easing.ts,
                      pack-art.ts, pack-opener-storage.ts, preload-pack.ts, set-index.ts,
                      texture-cache.ts (every image texture, see "Card data")
  hooks/             useCollapseOnOutsidePointer, useNeighbourLogoPreload,
                      usePrefersReducedMotion, usePrices, useSafeTexture, useSetNavigation
  stores/
    pack-opener.ts   Zustand store: the idle/tearing/revealing/done state machine, the
                      selected set and currency (saved with zustand's persist, never
                      through localStorage directly), resetSession()
    pack-opener-types.ts  State and action types
  components/
    PackOpenerPage.tsx  The page
    PackOpenerLoading, PackOpenerUnavailable  The route's loading and offline screens.
                      They render from the entry chunk, see "Bundle"
    PackOpenerDialog, ConfirmDialog, CurrencyToggle, PriceValue, TreatmentBadge  Shared by
                      the HUD and the carousel
    carousel/        SetCarousel and SetLogo (the set picker), LeavePackDialog, SetInfoDialog
                      and its sections, set-dropdown-options.ts
    hud/             2D page chrome BELOW the canvas, not overlaid on it: IdleOverlay,
                      RevealCaption, PackSummary, PackLedger, PackLedgerRow, SessionControls,
                      SessionStatsDialog and its sections, ResetSessionDialog. The one
                      exception is CardLoadingIndicator, shown over the card back while a
                      card's art is still downloading
    scene/           react-three-fiber scene:
      PackOpenerCanvas  The canvas
      CameraRig      Scripted camera, no OrbitControls
      PackMesh, PackMaterial, TearBurst  The pack and its top-seal tear animation
      CardStack3D    Composes the active and outgoing cards with CelebrationEffects
      Card3D, CardFace, CardFaceMaterial  A static face-up card: which art it shows, and
                      its unlit material or foil. Never rotates.
      OutgoingCard, outgoingSlide.ts, revealIntro.ts  The reveal, see "Reveal mechanic"
      CelebrationEffects, PullCelebration, PullSparkles, LegendaryFireworks  Rare pulls
      pointerTilt.ts  Pointer-to-tilt maths shared by the card and the pack
      useCardTilt.ts  The card's tilt and the foil's light direction, in one useFrame
      materials/foilMaterial.ts  The cold foil shader
      textures/      pack-art-strips.ts, mock-pack-texture.ts, glow-texture.ts,
                      make-canvas-texture.ts
  config/            scene.ts (animation timing, camera targets, sizes), celebration.ts (one
                      config per celebration tier), known-sets.ts (which products ship and why)
  i18n/en.json       Namespace "pack-opener". Carries its own card.rarity.* block, since rarity
                      labels are per-app translations, not centrally shared
```

## State machine

`idle -> tearing -> revealing(index) -> done`, owned entirely by `stores/pack-opener.ts`.
The store is the sole source of truth for animation timing (`phaseStartedAt` — every
`useFrame` timer in the scene reads off this single timestamp); 3D components and the HUD
are pure readers, never independent timers. `openPack()` generates and orders a new pack and
schedules the tear-to-reveal transition itself. If the set's printings aren't cached yet it
waits for them first, so every surface resolves the same cards; a failed load still deals,
and switching set or resetting cancels the wait. `advanceReveal()` only debounces against a
single tap firing twice (`ADVANCE_DEBOUNCE_MS`, 120ms) — there's no wait for an animation
to finish, so tapping fast skips through the pack quickly.

## Reveal mechanic

Cards never flip or rotate. The active card (`Card3D`, in `CardStack3D.tsx`) is always
rendered face-up and static; the "reveal" is `OutgoingCard` sliding the _previous_ card
up and off (timed off the same `phaseStartedAt`), exposing the already-in-place active
card underneath — like pulling the top card off a physical stack, not turning one over.
Nothing else renders beneath the active card: peeks, box stacks and flips were all tried
and removed on explicit feedback.

## Rendering

Nothing in this scene is lit. There are no lights and no drei `<Environment>`: the card
faces, the foil shader, the celebration glow, the sparkles and the pack are all unlit
materials, so there was nothing left for them to light. A card's image is meant to read
true-to-source, like a photo, not as a physically-lit 3D object — running real card art
through ambient + directional + studio-environment lighting washed the colors out. The
pack went the same way once it carried real product photography: a computed specular
highlight on top of a photograph that already has its own is additive, so it lifted the
blacks and most FAB pack fronts are largely black behind the character art.

Removing `<Environment>` also removed an HDRI download and, with it, a measured ~300ms
where the canvas rendered nothing at all on first load while that texture resolved.

The one thing that DOES respond to light is the cold foil, and it makes its
own. `materials/foilMaterial.ts` models the actual printing process: a
mirror-bright metallic layer under the card, with the artwork printed on top
in translucent ink, so ink density alone decides where the foil shows
through. One broad soft reflection sweeps across it as the card tilts.
Achromatic at every angle, which is the property that separates cold foil
from Rainbow Foil. No mask, no surface normal, no grain — the card is flat
and the foil is smooth, so there is no texture to give it. No scene lights
and no environment map either: three.js metalness with nothing to reflect
renders black, and the alternative was re-adding the HDRI this section
exists to explain the removal of.

Read that file's header before changing any of it. It records two earlier
versions that both looked plausible in a still frame and were both wrong —
a swept highlight that read as a torch shone on paper, and a brushed satin
metal that read as a texture cold foil does not have.

**The transparent queue is the trap in this scene.** three.js draws every transparent
material after every opaque one, whatever `renderOrder` says. The card is opaque (it cuts
its rounded corners with `alphaTest`/`discard`, deliberately, rather than blending), and
every celebration effect is additive and therefore transparent. So anything additive
nearer the camera than the card's furthest tilt excursion paints straight over the card.
`CELEBRATION_Z` in `config/scene.ts` is the single number that keeps them all clear of it.
The same rule is why the foil shader adds its highlight in the fragment shader rather than
switching the material to `AdditiveBlending`.

## Bundle

three.js, fiber and drei must not load for visitors who never open this app. `index.ts`
runs on every page, so its bug-report provider imports the store on demand, and the route
loader imports `lib/texture-cache.ts` dynamically for the same reason. Keep anything reachable
from those two entry points free of static scene and store imports. `config/scene.ts` has
no imports for this reason.

The service worker's precache is the other way in, since every visitor downloads all of it.
`vite.config.ts` keeps this app's chunks out with `globIgnores`, by chunk name, and
`scripts/update-pwa-assets.ts` keeps the pack artwork and set logos out of `includeAssets`.
Only the card back is precached. Three `runtimeCaching` rules store the chunks, data and
artwork once someone has opened the app, so it works offline after a first visit; before
that, the route shows `PackOpenerUnavailable`.

## Card data

Cards are real Flesh and Blood cards, resolved per the set the open pack was actually
generated from. `src/shared/data/fab-printings.ts` fetches one JSON file per set
(`public/data/pack-opener/sets/<CODE>.json`, built by `scripts/build-pack-data.ts` from the
develop branch of github.com/the-fab-cube/flesh-and-blood-cards; its main branch lags well
behind) — every real _printing_ of a card, with that set's own rarity, foil treatments,
and TCGplayer product id. CI and the Pages deploy check that repository out and read it from
disk (`FAB_CUBE_DIR`); a local run downloads the same files instead. The store's `warmSet` loads a set's printings and prices whenever
it is selected, ahead of the next `openPack()`.

**A double-faced card is one row.** The build drops back-face rows by image filename
(`is_front` is unreliable upstream, inverted on DTD164), so a double-faced card is dealt at
its real rate, and its other face is only reached through the flip control, via
`backImageUrl`. Two-sided Marvels work the same way. Printings are matched to cards by
unique id, since both faces of a card share one collector id.

**A set that hasn't been picked up by the-fab-cube yet can still ship** via a
self-retiring bridge, `scripts/pre-release-bridge.ts`: `PRE_RELEASE_SETS` lists sets whose
card data instead comes from `@flesh-and-blood/cards` (fabrary's own compiled pre-release
feed, pinned exactly as a devDependency), mapped onto the same `RawCard`/`RawPrinting`
shapes the-fab-cube's data already produces so nothing downstream has to know the
difference. Usurp the Shadow Throne (IAR) is the current case: develop's `card.json` only
carries 11 preview printings for it. The bridge only takes over while that stays true — the
moment develop's own count for a bridged code overtakes the bridge's, `bun run
build-pack-data` logs that the entry is no longer needed and stops using it on its own, no
build failure either way.

`resolveCard` (`cards/card-resolver.ts`) picks a real printing from the pack's own
set (`packSetCode` in the store) whose rarity, expansion-slot flag, required type and
class-restriction all match what was actually drawn — deterministically per drawn-card id
(`hashToIndex`) so re-renders don't reshuffle which card a slot shows. Every declared slot
in every real set's `PackConfig` is verified non-empty against that set's own pool by
`tests/pack-opener/pool-viability.test.ts`.

**The printing wins over the draw** in a few cases, see `resolveTreatment`: a Fabled always
takes its own foiling, and a "standard" draw of a foil-only card takes the foil.

**The Cold Foil upgrade never shows a card that doesn't exist.** It targets a slot, and that
slot's rarity often has no cold printing: Heavy Hitters upgrades a Token but prints no cold
Tokens. So it redraws from the set's real cold printings, excluding Legendary, Fabled and
Marvel so an upgrade can't raise their published or estimated rates. How often a pack
upgrades is unchanged. A redrawn card can show a different rarity from its slot, so anything
counting pulls (session stats, analytics) uses the resolved rarity, not the drawn one.

**When a set's data is missing or failed to load**, the resolver returns a placeholder
(a null name) instead of a real card. The scene shows it as the card
back with its treatment, and the HUD supplies a translated name. `DEFAULT_PACK_CONFIG` (the
mock `"default-mock-set"`) is what deals when no set is selected. A pack with no artwork
falls back to `mock-pack-texture.ts`, a text-free gradient and sheen; every set has real art
today, so this only appears when the index or an image fails.

A real card's own image already IS the fully rendered card face. Every image goes through
`lib/texture-cache.ts` rather than drei's `useTexture`, because a 404 there throws
from inside three.js's own image handler, outside React, and takes the whole route with it.
It reports failure instead, so `CardFace` can fall back from the face asked
for, to the card's front, to the card back. It also sets sRGB once at load, so the same art
looks the same whichever material saw it first, shares one download between a preload and a
mounted card, evicts all but the most recent textures per pack (`trimSafeTextureCache`), and
forgets failures per pack so a brief network drop doesn't cost a card its art for the whole
session (`clearFailedTextureUrls`). The store preloads a pack's art as it's dealt
(`preloadPackTextures`), covered by the ~1.9s tear.

CORS note: `content.fabrary.net` (the image host) only returns
`Access-Control-Allow-Origin` when a request actually carries an `Origin` header — a
bare `curl` without one won't show it, which looked like a dealbreaker until verified
with `curl -H "Origin: ..."`. Three.js's loaders default `crossOrigin` to `"anonymous"`,
so this works with zero extra configuration.

## Odds

Every rate that decides what a pack deals lives in `pack/published-rates.ts`, each tagged
PUBLISHED, OBSERVED, ESTIMATED or POPULATION, and `pack/set-configs.ts` turns them into each
set's config. The twenty sets with a Collectors Centre page on fabtcg.com (for example
fabtcg.com/collectors-centre/high-seas/) are transcribed verbatim in
`docs/pull-rate-verification.md`, including Compendium of Rathe and Omens of the Third Age,
which were read off the live pages by hand. The rest come from elsewhere: the Antiquity Pack
from LSS's own breakdown, Mastery Packs and GEM Packs from product pages or the FAQ, and
Usurp the Shadow Throne borrows Omens' rates.

`tests/pack-opener/calibration.test.ts` simulates 200,000 packs per set and asserts every
published rate within 20%, so a config cannot quietly drift away from its source. That file
is the guard; changing a weight without changing the transcription will fail it.

Read `docs/pull-rate-verification.md` before touching any config. It records which figures
are published and which are not:
- **Fabled** is unpublished except on the Antiquity Pack, and is estimated at half the set's
  Marvel rate (`fabledChanceFor`), so a set's rarest card stays reachable. Sets whose boosters
  hold no Fabled printing deal none.
- **Marvel** is published for eight sets and estimated at 1 per 100 for Bright Lights, Rosetta,
  The Hunted, Super Slam, Omens, Usurp the Shadow Throne and both Mastery Packs.
- **Cold foil** is a published per-set rate (usually 1 per 24 packs, one display) applied as a
  pack-level upgrade roll rather than a slot.

`pack/odds.ts`'s `DEFAULT_*` constants are placeholders for the mock config only.

## Prices and currency

Two marketplaces, never one converted into the other. USD prices are TCGplayer's,
mirrored by tcgcsv.com (`src/shared/data/fab-prices.ts`, keyed by
`tcgplayerProductId:treatment`); EUR prices are Cardmarket's own daily catalogue
(`src/shared/data/fab-prices-cm.ts`, keyed by a printing's `uniqueId`, which is why
`ResolvedCard` carries `printingId` as well). Both are build-time snapshots written by
`scripts/build-pack-data.ts` into `public/data/pack-opener/prices/` and `prices-cm/`;
neither can be fetched live from a browser.

**Components never touch either module directly — they call `lib/pricing.ts`**, through the
`usePrices` hook. That file takes the currency and hands back a number or null, so the two
different keying schemes stay in one place and every surface (the pack ledger, the reveal
caption, the session totals, the set info dialog) can never end up showing different
marketplaces at once. The currency itself lives in the store (persisted per device) for the
same reason. Snapshots live in module caches React can't watch, so the store bumps
`pricesVersion` when one lands and `usePrices` re-reads, so a figure read too early doesn't
stay missing.

A missing price is normal and shows "Not priced yet", never a zero and never the other
currency's figure. About 18% of printings have no euro price. Nearly all of those are the
first print run of the oldest sets (Welcome to Rathe, Arcane Rising, Crucible of War, Monarch,
Tales of Aria, about half of each), because a Cardmarket expansion is matched to one print
run, the Unlimited one there. Elsewhere coverage is 93% or better. `scripts/cardmarket.ts`
pairs our printings against Cardmarket's products only when the two counts agree exactly and
writes nothing when they do not, and writes nothing for a chunk holding an unpriced product.
That file's header is the full story, including why the two catalogues disagree about cards
like Crucible of War's Mandible Claw.

## Session

`openedPacksThisSession` is in-memory only and resets on reload. `resetSession()` clears it
and puts a closed pack back on the counter, keeping the selected set and re-rolling its
artwork; it is destructive with no undo, so `ResetSessionDialog` confirms first, the same
gate `LeavePackDialog` puts in front of discarding an in-flight pack.

## Decided, don't reopen

**Foil art: keep our own shaders, and never resolve `-RF`/`-CF` slugs.** The shader responds
to the card's tilt, and LSS's foil art is a flat still with the foil printed into the image,
so the two would double up. It's unusable anyway: fabrary serves the base image for those
slugs (identical ETags for `EVO013` and `EVO013-RF`), and the genuine renders were only on
LSS's S3, which sent no CORS header when checked. This is why `printingImageUrl` only uses
`artSlug` for Marvels.

**Smaller card images are a dead end.** LSS's S3 had the same cards at 546x763 for about 60 KB,
a quarter of fabrary's weight, but with no `Access-Control-Allow-Origin` header, so WebGL can't
use the pixels. Fabrary has no smaller variant (`?w=` and `?width=` are ignored, `/small/` and
`.width-N` return 404). Self-hosting re-encoded copies means shipping thousands of images,
hundreds of MB. The levers are when and how often we fetch, not how big each file is.

## Deferred

- **Edition fidelity.** The build doesn't separate print runs, so a Welcome to Rathe pool mixes
  Alpha and Unlimited printings of the same card. Non-Marvel art comes from the collector id, so
  the image is the same either way, but a pack doesn't model which run it came from, and euro
  prices only attach to the run Cardmarket matched.
- **A higher-resolution card back.** `public/img/pack-opener/card-back.webp` is 300x419 and
  poorly compressed. Replacing it is a straight file swap with no code change.

## Import Rules

Same as every app: import from `@fabkit/platform/*` and `@fabkit/shared/*` only, never from
other apps. Route file is `src/routes/pack-opener.tsx`.
