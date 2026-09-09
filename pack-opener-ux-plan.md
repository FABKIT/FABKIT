# Pack Opener UX Revamp: Execution Plan

Audience: the implementing agent (Sonnet). Product owner: Louis (non-technical).

## How to work this plan

1. **Interview and challenge Louis whenever a choice has a visible trade-off.** He has
   explicitly asked for this. Do not silently pick a side on anything marked
   **ASK LOUIS**. Explain options in plain language, not in code terms. He is a
   graphic and web designer, so visual and layout reasoning lands well; React and
   three.js terminology does not.
2. **Five commits, in the order given.** Do not merge them into one. Do not split
   them further. Each commit must build and pass `bun test` on its own.
   **Exception:** commit 5's performance questions must be put to Louis at the
   **start** of the batch, not when you reach commit 5. He asked for that analysis as
   a question and it is already answered below; get his decision early so the work
   itself can land last without a conversation stalling it.
3. **Before you can test commit 3, run `bun run build-pack-data`.**
   `public/data/pack-opener/` is gitignored, so your local JSON is the old shape with
   no `artSlug` field. Skip this step and every Marvel will keep resolving to the base
   card's art and you will wrongly conclude the fix does not work.
4. Use the `/commit` skill for every commit. Commits go up under Louis's GitHub
   account (LouisVanKey). **No Co-Authored-By line, no mention of Claude anywhere in
   the commit message.**
5. After each commit, recap to Louis in plain language what changed and what he should
   look at. Keep the commit message itself technical.
6. **No em-dashes in any user-facing text you write or change.** That means the strings
   in `src/apps/pack-opener/i18n/en.json` and anything rendered on screen. Code
   comments are not user-facing and are full of em-dashes already; leave them alone.
   Do not run a global find-and-replace.
7. Every user-facing string goes through `t()` in the `"pack-opener"` namespace. Use
   semantic colour tokens from `src/styles/index.css`, never `dark:` variants.
8. Run `bun format` and `bun run build` before each commit. Run `bun test` for any
   commit that touches `pack/`, `cards/`, or the build script.

## Background research (already verified, do not redo)

These were confirmed by direct inspection before this plan was written. Treat them as
established facts.

- **Set logos** come from Legend Story Studios' own CDN
  (`dhhim4ltzu1pj.cloudfront.net`), carried through the community dataset's
  `set_logo` field by `scripts/build-pack-data.ts` into
  `public/data/pack-opener/index.json` as `SetIndexEntry.setLogo`. Nobody uploaded
  them. Compendium of Rathe (PEN) has no logo in the source data, so a name-only
  fallback must survive.
- **Pull rates and pack composition** are already researched to a high standard in
  `src/apps/pack-opener/pack/set-configs.ts`: 20 sets, each transcribed from its own
  fabtcg.com product page with the quoted source text, calibrated against
  collectors-centre published aggregate rates where those exist, with every
  approximation flagged in a comment. **Do not re-derive or "improve" these numbers.**
  Read them and present them.
- **Card images have transparent rounded corners baked in.** Verified: the webp files
  are VP8X with the alpha flag set. So the geometry does not need rounding; the plain
  material simply discards alpha.
- **Marvel cards share a collector number with the base card.** In High Seas, `SEA001`
  is both the normal hero and its Marvel version. `printingImageUrl(printing.id)`
  therefore builds the base card's URL for both. The source data carries the real
  artwork filename in `image_url`; for Marvels its basename is `SEA001-MV`. Verified
  live: `https://content.fabrary.net/cards/SEA001-MV.webp` returns 200 with
  `Access-Control-Allow-Origin: *`. Also verified for the irregular cases
  `MST095-MV`, `SEA189-TP`, `MI_SUP009-MV`, `HNT264-MV_BACK`.
- **Marvel front-and-back is supported by the data.** Marvel printings carry a
  `double_sided_card_info` block and a matching `-MV_BACK` image. This is a future
  feature, not part of this batch.
- **Legendaries are foil-only in modern sets, but not universally.** Count of
  non-foil Legendary printings per set: ARC 0, DYN 0, ELE 0, HVY 0, MON 0, MST 0,
  OMN 0, OUT 0, ROS 0, UPR 0, WTR 0; but SEA 1, HNT 1, EVR 1, SUP 2, CRU 2, DTD 3,
  EVO 4, PEN 8, 1HP 9. So the rule is per set, and the data already answers it.
  **Never hardcode "legendary is always foil".**
- **A pack really can contain two foils.** Confirmed from the configs, not from
  memory: in High Seas (`SEA`) the `premium-foil` slot is Common-only and guaranteed
  Rainbow Foil, while the separate `basic-or-wildcard` slot can land Legendary or
  Marvel, which are themselves foil printings.

## Louis's decisions already made (do not reopen)

| Question | Decision |
|---|---|
| Switching sets mid-reveal | Allowed, but behind a confirmation. The abandoned pack is **discarded and does NOT enter session stats.** Louis's reasoning: session stats exist to show how much value you pulled, so counting cards the player never saw would be misleading. |
| Real LSS foil artwork (`-RF`/`-CF` images) instead of the shader | **Decided: keep our own shaders for Rainbow Foil and Cold Foil. Closed, not deferred.** The shader responds to the card's tilt; LSS's foil art is a flat still. It was unusable anyway: fabrary serves the base image for `-RF`/`-CF` slugs (identical ETags on `EVO013`), and the genuine renders live only on LSS's S3, which sends no CORS header. **Do not touch the foil shader's look, and do not resolve `-RF`/`-CF` slugs anywhere.** |
| Pull-rate percentages | Show them, with one short honesty note that some rates are estimated where LSS has not published them. |
| Legendary foil disagreement | The real printed card wins, decided per set from that set's own printings. Faithfulness to opening a real pack is the goal. |

---

# Commit 1: Set picker and the pull rates dialog

**Files:** `components/carousel/SetCarousel.tsx`,
`components/carousel/SetInfoDialog.tsx`, `components/hud/SessionStatsDialog.tsx`,
`i18n/en.json`, plus a new confirmation dialog component.

### 1.1 Bigger logo, no duplicate set name

Current: `h-8 max-w-28` logo, then the set name and release year repeated underneath as
text, then a small underlined text link.

Target: roughly double the logo size (start at `h-16`, `max-w-56`, keep
`object-contain` and `w-auto`), and delete the set-name and release-year text block
entirely. The logo already says the name. Keep the `Package` icon fallback for PEN,
but scale it up to match and render the set name as text **only** in that fallback
case, since an icon alone identifies nothing.

Remove the `releaseYear` computation once nothing reads it.

### 1.2 Replace the text link with a real button

The "Pull rates and pack contents" affordance is currently bare underlined text. Make
it a proper button matching the rest of FABKIT. The house pattern is the primary
button already used at the bottom of `SetInfoDialog.tsx`:

```
rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90
```

This one sits under a logo on a busy 3D scene, so use a **secondary** weight of the
same family rather than a solid primary block: bordered, transparent background,
primary text. Something in the shape of

```
rounded-md border border-primary bg-surface/70 px-3.5 py-2 text-sm font-semibold text-primary backdrop-blur transition-colors hover:bg-surface-active
```

Show it to Louis and adjust. Keep the existing i18n key `carousel.set_info_button`.

### 1.3 Add a dropdown next to the arrows

Louis wants what the card creator's card back selector does: left arrow, the current
thing, right arrow, plus a way to jump straight to any option. Read
`src/apps/card-creator/components/card-creator/fields/CardBackField.tsx` for the exact
pattern and reuse `Select` from `@fabkit/platform/components/form/Select`.

Difference from that field: the visible control here is a **logo image**, not a text
label. So do not put the Select in the middle. Put a small chevron-down button
immediately to the right of the logo (before the right arrow, or after it, whichever
reads better; show Louis both), which opens the set list.

`Select`'s button renders a text label, which is wrong for a logo. **Reuse `Select`**
with a `buttonClassName` that collapses the button down to just the chevron, and render
the logo separately beside it. That is the same choice `CardBackField` makes and it
keeps one shared dropdown component. Do not reimplement Headless UI `Listbox` here.

Options list = every set from `getSetIndex()`, labelled by set name; selecting one calls
`selectSet`.

**ASK LOUIS** whether the chevron reads better immediately right of the logo (inside the
arrow pair) or outside the right arrow. That one is genuinely visual; show him both.

### 1.4 Verify swipe on mobile

Louis asked whether finger-sliding works. It is implemented
(`onTouchStart`/`onTouchEnd`, 40px threshold) but has a real problem: the swipe
handler is on the carousel's own wrapper `div`, which is a narrow strip at the top of
the page. Confirm on an actual narrow viewport whether that strip is wide and tall
enough to swipe comfortably. If it is not, either grow the touch target or report back
to Louis rather than quietly redesigning it.

Also check the swipe does not fight the page's own scroll. Report findings.

### 1.5 Keep the carousel visible during tearing and revealing

Current line:

```ts
const visible = phase !== "tearing" && phase !== "revealing" && sets.length > 0;
```

Change to `sets.length > 0`. The carousel then never disappears.

**This has a consequence that must be handled in the same commit.** `selectSet` resets
`phase` to `idle` and clears `pack`. A pack is only recorded into
`openedPacksThisSession` when it finishes, so switching mid-reveal silently throws that
pack away. Louis has decided that discarding it **is** the correct behaviour (session
stats should never contain cards the player did not see), but that it must not happen
silently.

So the store logic does not change at all. What you add is a confirmation gate in the
UI:

- In `SetCarousel.tsx`, when a set change is requested (arrow, dropdown, swipe, or
  arrow key) **and** the store has `pack !== null` with `phase` of `"tearing"` or
  `"revealing"`, do not call `selectSet` yet. Open a small confirmation dialog first.
- Wording, plain and non-scary, no em-dash. Something like: title "Leave this pack?",
  body "You have not finished opening this pack. If you switch sets now, this pack is
  discarded and will not count towards your session stats." Buttons: "Switch set" and
  "Keep opening".
- On confirm, call `selectSet` exactly as today. On cancel, do nothing.
- Build it with the Headless UI `Dialog` pattern already used by `SetInfoDialog.tsx`,
  including the `lg:pl-72` centring fix in 1.6 below so it lines up with the sidebar.

**Leave the existing store guard in place.** `selectSet`'s
`if (phase === "tearing" || phase === "revealing") return;` currently blocks the switch
outright. It must be **relaxed, not deleted**: the dialog is the user-facing gate, but
the store should still be the thing that decides. Simplest correct shape is to keep
`selectSet` unconditional (it already resets everything cleanly) and rely on the dialog,
while keeping a comment explaining that the UI gate is deliberate and where it lives.

Add a test in `tests/pack-opener/` asserting that switching sets during `revealing`
leaves `packsOpenedThisSession` at 0 and `openedPacksThisSession` empty, so a future
change cannot quietly start counting abandoned packs.

## Part two: the dialog the button opens

**Files:** `components/carousel/SetInfoDialog.tsx`, `i18n/en.json`

### 1.6 Centre it accounting for the sidebar

The dialog currently uses `fixed inset-0 flex items-center justify-center`, which
centres it on the whole viewport, ignoring the 18rem desktop sidebar. Louis is right
that it looks off-centre.

The house pattern is in `src/platform/components/layout/Footer.tsx`:
`lg:pl-72`. Apply the same class to the dialog's centring wrapper so it centres in the
content area on desktop and stays viewport-centred on mobile. Do not hardcode a pixel
value measured from a screenshot.

Check whether `SessionStatsDialog.tsx` has the same problem. If it does, fix it here
too, so the two dialogs stay consistent.

### 1.7 Add actual pull rates

This is the substance of the request. Right now the dialog lists slots and the rarity
names each slot can land on, but no percentages at all.

Compute the per-rarity probability from the config, which is entirely derivable:

For each slot, each `RarityWeight` entry's chance within that slot is
`entry.weight / sum(all weights in that slot)`. The expected number of cards of a given
rarity per pack is the sum, across all slots, of `slot.count × (that slot's chance for
that rarity)`.

Present it as, per set, a list of rarity rows: the rarity symbol
(`CardRarities[rarity].icon`, same images the summary and caption use), the rarity name,
and the rate. **ASK LOUIS** how he wants rates below 1 percent expressed, since "0.4%"
is less readable than "about 1 in 240 packs" for the rare stuff. Suggest: percentages
down to 1 percent, then switch to "1 in N packs" below that.

Order the list from most common to rarest.

Then, **below** the rates, keep the existing pack composition list (which is already
good), and **below that**, keep the Current Prices section. That is the order Louis
asked for: rates, then composition, then prices.

### 1.8 The honesty note

Per Louis's decision, add one short line under the rates. Something like:

> Some rates are estimated where Legend Story Studios has not published them.

No em-dash. Style it as `text-xs text-subtle`. This matters: `set-configs.ts`
documents at length that many weights are derived from how many cards of each rarity
exist in the set, not from published figures, and FAB players will notice.

Keep the existing "See the official product page" link.

### 1.9 Cold foil line

The existing cold-foil note (`dialog.cold_foil_note`) belongs with the rates now, not
floating under the composition list. Move it into the rates section.

---


---

# Commit 2: The card in the scene

**Files:** `components/scene/Card3D.tsx`, `components/scene/OutgoingCard.tsx`,
`components/scene/materials/foilMaterial.ts`, `config/scene.ts`,
`components/hud/RevealCaption.tsx`, `components/PackOpenerPage.tsx`,
`components/scene/CardStack3D.tsx`, `components/scene/CameraRig.tsx`, plus a new
celebration component.

### 2.1 Rounded corners on every card

Cause confirmed: the card images carry an alpha channel with transparent rounded
corners. The foil shader writes `gl_FragColor = vec4(color, base.a)` so alpha survives
there, but `<meshBasicMaterial map={texture} />` ignores alpha unless told not to.

Fix in `Card3D.tsx`'s `CardFaceMaterial`:

- Plain path: `<meshBasicMaterial map={texture} transparent alphaTest={0.5} />`
- Foil path: the drei `shaderMaterial` does not set `transparent` by default. Set
  `foilMaterial.transparent = true` and add an `alphaTest`, or discard in the shader
  (`if (base.a < 0.5) discard;` right after the texture sample).

Prefer `alphaTest`/`discard` over plain `transparent`, because a transparent material
without depth-write can sort badly against the outgoing card. Verify both a common and
a rainbow foil card look identical at the corners.

### 2.2 Fix cards showing through each other

Cause confirmed by geometry. The outgoing card sits at `z = 0.03`
(`OutgoingCard.tsx`). The active card underneath tilts with the pointer up to
`CARD_TILT_MAX_DEG = 12` degrees. The card is `CARD_HEIGHT ≈ 1.675` units tall, so a
corner swings roughly `sin(12°) × 0.84 ≈ 0.17` units forward in Y alone, plus about
`0.13` in X. That is far more than the `0.03` gap, so the two planes genuinely
intersect and the card behind pokes through. This is exactly Louis's screenshot.

**Do not fix this by increasing the z gap.** At camera z 3.2 with a 35 degree field of
view, moving the outgoing card to ~0.35 would render it about 11 percent larger than
the card beneath it, which reads as a size pop.

Correct fix, given only two cards are ever in the scene during `revealing` (PackMesh is
unmounted then, see `PackOpenerCanvas.tsx`): make the outgoing card always paint on
top, regardless of geometry.

- Set `renderOrder` on the outgoing card's group/mesh higher than the active card's.
- Set `depthTest={false}` (and `depthWrite={false}`) on the outgoing card's material.

`Card3D` needs a way to express this. Add an optional prop such as
`alwaysOnTop?: boolean`, threaded down to `CardFaceMaterial`, applied to both the
plain and foil paths. `OutgoingCard` passes it; nothing else does.

**Fallback if the foil shader misbehaves with depth testing off:** instead suppress the
active card's tilt for the duration of the slide (`REVEAL_TRANSITION_MS`, 320ms),
easing it back afterwards. Less elegant but guaranteed correct. **ASK LOUIS** only if
you have to fall back, since the fallback means the card is briefly not tiltable.

Verify by tilting the mouse to a corner and clicking rapidly through a pack.

### 2.3 Make the card smaller and close the gap below it

Louis: cards take up too much space, and there is too much white space between the 3D
card and the name and other text below it.

Two separate causes, fix both:

- **Card size.** Controlled by camera distance, not by geometry. Increase
  `REVEALING_CAMERA_POSITION`'s z from `3.2` (try `3.6`, then tune). Note this also
  reduces the relative punch of `CAMERA_PUNCH_BY_SLOT`. Since part two of this same
  commit replaces that punch with a glow, tune the two together and judge the final
  look once, rather than adjusting the camera twice.
- **The gap.** `PackOpenerPage.tsx` gives the canvas `flex-1`, so the canvas always
  eats all leftover height and the card is centred inside it, leaving dead space
  underneath. Reduce `RevealCaption`'s own `py-4` and, more importantly, pull the card
  down within the canvas by lowering the camera's y target for the revealing phase, or
  cap the canvas height. Try the camera y first; it does not disturb layout.

These are pure taste values. Get one version on screen, screenshot it, and **ASK
LOUIS** to sign off before moving on. Do not tune blind.

### 2.4 Rarity symbol next to the rarity label

In `RevealCaption.tsx` the rarity icon currently sits next to the **card name** on the
first line, and the rarity word sits alone on the second line. Louis wants the C symbol
immediately to the left of the word "Common".

Move the `<img src={CardRarities[resolved.rarity].icon}>` out of the name row and into
the rarity row, before the `<span>` carrying the label. Keep `alt=""` since the word
next to it already carries the meaning. Size it to sit on the text baseline
comfortably (`h-4 w-4` is likely right next to `text-sm`; check).

The name row then becomes name only.

---

## Part two: celebrating a good pull, and replaying the tear

**Files:** new `components/scene/PullCelebration.tsx` (or similar),
`components/scene/CardStack3D.tsx`, `config/scene.ts`,
`components/hud/PackSummary.tsx`, `stores/pack-opener.ts`

### 2.5 Stop scaling the premium card up

Louis: the final rainbow foil card gets bigger and that is not needed.

The size change comes from `CAMERA_PUNCH_BY_SLOT` in `config/scene.ts` (`premium-foil`
gets `0.45`). Find where `CameraRig` consumes it and reduce the punch substantially or
remove it. **ASK LOUIS** whether he wants it gone entirely or just softened, because a
small push-in can still read as emphasis without looking like a zoom.

### 2.6 Add a glow / flash behind the card instead

Replace the zoom with light behind the card. The trigger should be **rarity or
treatment**, not just the premium slot, because Louis specifically wants Majestic and
Legendary celebrated even when they are not foil:

Celebrate when any of these is true for the active resolved card:
- `treatment !== "standard"` (rainbow, cold, gold-cold)
- `rarity` is `"majestic"`, `"legendary"`, `"fabled"`, or `"marvel"`

Suggested tiers, to confirm with Louis:
- Majestic: warm gold glow, gentle
- Legendary / Fabled: stronger gold glow with a brief flash on reveal
- Foil treatments: spectral / rainbow-tinted glow
- Marvel: the biggest of all

Implementation guidance: keep it cheap. A single additive plane behind the card,
slightly larger than it, with a radial-gradient texture and an animated opacity/scale
driven off `phaseStartedAt` (the same single timestamp everything else reads), is far
cheaper than a particle system and will hold up on weak devices. Do not add a
post-processing pass; that would pull in `@react-three/postprocessing` and undo the
performance work in commit 5.

Respect `usePrefersReducedMotion()`: hold a static glow rather than animating it.

**ASK LOUIS** to review the effect on screen before committing. Describe it in visual
terms, not shader terms.

### 2.7 Replay the tear animation on "Open Another Pack"

Louis: clicking "Open another pack" must show the top-of-pack ripping animation in full
again.

Check whether this already works. `openPack()` sets `phase: "tearing"` and
`phaseStartedAt: Date.now()`, and `PackOpenerCanvas` mounts `PackMesh` for
`idle | tearing`. So the machinery is there. The likely problem is that `PackMesh` and
its tear timers were unmounted during `revealing`/`done` and remount cleanly, or
conversely that some piece of state persists. **Test it first**, then fix only what is
actually broken. Report to Louis what you found rather than assuming.

If `packArtUrl` should be re-rolled per pack (a different pack artwork each time), that
is a separate question. Currently it is chosen once per set and held stable
deliberately. **ASK LOUIS** whether he wants a fresh random pack artwork per opening.
Note: `public/img/pack-opener/packs/` is currently empty, so every set falls back to
the canvas-drawn mock pack. Flag this to Louis; it is not in scope to fix, but he may
not know no pack artwork has been uploaded.

---

# Commit 3: Marvel artwork and Legendary foiling

**Files:** `scripts/build-pack-data.ts`, `src/shared/data/fab-printings.ts`,
`src/apps/pack-opener/cards/card-resolver.ts`, tests

**Read this before starting.** `public/data/pack-opener/` is gitignored
(`.gitignore` line 35) and confirmed untracked, so the JSON is local build output that
CI regenerates. Two consequences:

- Nothing in `public/data/` gets committed. The commit is source changes only.
- **You must run `bun run build-pack-data` locally before you can test any of this.**
  Until you do, your local JSON is the old shape with no `artSlug` field, every Marvel
  will keep resolving to the base card's art, and you will wrongly conclude the change
  did not work.

### 3.1 Carry the real artwork slug through the build

The upstream printing record (`RawPrinting` in `scripts/build-pack-data.ts`) has more
fields than the script currently reads. Add:

- `unique_id` (string) as `uniqueId` on `FabPrinting`. This is the true per-printing
  identity; `id` collides between a card and its Marvel version.
- `art_variations` (string array) as `artVariations`.
- A derived `artSlug`: the basename of `image_url` with its extension stripped.
  Example: `.../SEA001-MV.webp` gives `SEA001-MV`.

Update `FabPrinting` in `src/shared/data/fab-printings.ts` to match. Treat a missing
`image_url` as `artSlug: null` and fall back, do not throw.

### 3.2 Use the slug for Marvel only

**This scope gate is critical.** 5,066 non-Marvel printings also have a slug that
differs from their id, including:

- `-RF` and `-CF` (480 slugs): rainbow and cold foil artwork with the foil **already
  printed into the image**. **Louis has decided we keep our own shader instead**, so
  these must never be resolved. They would double up with the shader, and fabrary
  serves the base image for them anyway.
- `U-` prefixes: Unlimited edition reprints, a different print run.
- `1HP186.width-450`: a resized thumbnail artifact, low resolution.

So:

```
printingImageUrl(printing) =>
  use printing.artSlug only when the printing is Marvel
  (rarity === "marvel", equivalently art_variations includes "FA"),
  otherwise use printing.id
```

Change `printingImageUrl` to take the whole `FabPrinting` rather than a bare id string,
and update `toResolvedCardFromPrinting` in `card-resolver.ts` accordingly. Keep the
host as `content.fabrary.net` in both cases; it is the CORS-verified one. The upstream
`image_url` hosts are not usable directly (one is a 4.5 MB PNG on Google Cloud Storage
with no CORS header).

Leave a comment recording exactly why the gate exists, so a future maintainer does not
"simplify" it away.

Verify by opening High Seas packs until a Marvel appears (High Seas has 42 Marvel
printings and a wildcard slot that reaches them), or write a small script that resolves
every Marvel printing and asserts the URL ends in a slug that is not the bare id.

**Known coverage limit, already measured. Do not chase it.** All 204 Marvel front-face
slugs were checked against fabrary. 196 return genuinely distinct artwork; 8 return the
same file as the base card (`HNT261`, `HNT262`, `HNT263`, `HNT264`, `SEA262`, `SEA263`,
`SEA264`, `MST026`, checked by comparing ETags). That is a gap in fabrary's library, not
a bug in this change, and there is nothing to fix on our side. 96 percent coverage is
the expected outcome.

### 3.3 Legendary foiling: the printed card wins

Today `poolForDrawn` in `card-resolver.ts` filters on rarity, expansion slot, required
type and class restriction, but **not** on foiling. So a Legendary drawn with
`treatment: "standard"` can resolve to a printing that only exists as rainbow or cold
foil, and then renders with no foil effect at all, which never happens in real life.

Per Louis's decision, the printing is the authority. Implement it this way:

In `toResolvedCardFromPrinting`, when the drawn `treatment` is `"standard"` but the
chosen printing's own `foiling` is not `"standard"`, adopt the printing's foiling as
the resolved card's `treatment`. Do **not** override in the other direction: if the
odds engine deliberately drew a cold foil (the cold foil upgrade roll), that must win,
because it is a pack mechanic rather than a property of the card.

**Accepted consequence, stated deliberately so it is not mistaken for a bug.** Some sets
print a Legendary both ways: High Seas has 1 non-foil Legendary against 10 foil ones,
Dusk till Dawn 3 against 12. Which printing a draw lands on is decided by
`hashToIndex`, so in practice most Legendary pulls will now come out foil regardless of
what the odds engine drew. That is the intended reading of "the real printed card
wins". **Say this to Louis in plain language before you commit it:** in most sets a
pulled Legendary will now always look foil, because that is the only way the set
actually printed it.

**Two knock-on effects you must handle in this same commit:**

1. **Prices.** `getCardPrice(setCode, tcgplayerProductId, treatment)` keys on the
   treatment. Since `treatment` now comes from the printing, and the printing's
   `tcgplayerProductId` is the one for that exact foiling, these stay in agreement.
   Verify with a Legendary pull that a price actually resolves rather than showing the
   "Not priced yet" dash.
2. **Pool viability.** `tests/pack-opener/pool-viability.test.ts` asserts every declared
   slot in every real set config has a non-empty pool. This change does not add a
   filter, so the pools are unchanged, but **run `bun test` and confirm.** If you find
   yourself needing to filter the pool by foiling instead, that test's assumptions
   change and it must be updated deliberately, not patched to pass.

Add a test asserting that for a set where every Legendary is foil-only (use `UPR` or
`MST`), a resolved Legendary never comes back with `treatment: "standard"`.

---

# Commit 4: The pack summary

**Files:** `components/hud/PackSummary.tsx`, `components/hud/PackOpenerHUD.tsx`,
`i18n/en.json`

### 4.1 Collapsible

Louis wants the summary to open and close: swipe on mobile, click on desktop.

Add local `expanded` state (`useState`, default open, since the summary appearing is
the reward). Collapsed state should still show a compact bar the player can tap to
reopen, carrying the headline number (total value pulled) so collapsing does not hide
everything. Animate the height with a CSS transition; respect
`prefers-reduced-motion` by skipping the transition.

Add a visible affordance: a chevron, or a small grab handle bar on mobile. Follow the
same swipe pattern already in `SetCarousel.tsx` (touch start / touch end with a
threshold) but on the vertical axis: swipe down to collapse, swipe up to expand.

### 4.2 Click outside to close

When expanded, a click anywhere outside the summary panel collapses it. Standard
approach: a `pointerdown` listener on `document` that checks the event target is not
inside a ref on the panel, cleaned up on unmount and when collapsed.

**Careful:** the whole 3D canvas sits behind this and the card responds to clicks. Make
sure the outside-click that closes the summary does not also count as a card tap.
During `done` the card is not advancing anyway, but verify.

### 4.3 Bigger prices

The per-card price is `text-xs` and the totals are `text-sm`. Bump the per-card price to
`text-sm` and the "Value of cards pulled" total to `text-base` or `text-lg`. Keep
`font-card-stat`. Show Louis and tune.

### 4.4 Session Stats becomes a sibling button

Currently "Session stats" is an inline underlined text link inside the summary, next to
"Packs opened this session: N".

Move it out. The bottom of the summary should have two buttons side by side:

- "Open Another Pack" (keep the existing primary style:
  `rounded-full bg-heading px-6 py-3 font-semibold text-surface shadow-lg`)
- "Session stats" as a secondary button of matching size and shape (bordered,
  transparent, primary text) so the two read as a pair.

They should sit in a row on desktop and stack on narrow screens. Keep the
"Packs opened this session: N" line where it is, now without the link and separator dot.

Keep `packsOpenedThisSession > 0` as the condition for showing the stats button. Note
that abandoned packs never increment it (see commit 1), so this counts only packs the
player actually finished, which is the intent.

---

# Commit 5: Performance

Louis asked for an analysis of how heavy this is on old devices, other browsers, and
slow connections. That analysis is below and has already been given to him. **Put the
"which of these do you want" question to him at the very start of the batch**, alongside
the other opening questions, even though the work itself lands last.

### Measured facts

Measured directly, not estimated.

- **Card images are 600x838 WebP, 170 to 245 KB each**, served from
  `content.fabrary.net` (Cloudflare, `Cache-Control: public, max-age=259200`, so three
  days of browser cache). A 16-card pack is therefore roughly **3.3 MB**.
- **All 16 fire at once.** `preloadPackTextures` in `stores/pack-opener.ts` calls
  `preloadSafeTexture` for every card the moment the pack is generated. On a slow
  connection this saturates the pipe and nothing arrives in a useful order.
- **A card that has not loaded renders as nothing.** `useSafeTexture` returns
  `{ status: "loading" }` and `Card3D`'s `RealCardFace` returns `null` for it, so the
  player sees empty space rather than a card.
- The pack opener route ships a **910 KB** JavaScript chunk (**243 KB** gzipped): three.js
  plus drei. Code-split, so it only downloads for visitors to this page. Normal for 3D,
  not the problem.
- `<Environment preset="studio" />` in `PackOpenerCanvas.tsx` fetches an HDR environment
  map from the third-party pmndrs CDN at runtime and builds a PMREM cubemap on the GPU.
  Only `PackMesh` (`meshPhysicalMaterial`) uses it, for about 1.5 seconds per pack. The
  cards are deliberately unlit and ignore it entirely.
- Per-set card data is 33 to 58 KB, lazily loaded per set. Fine as is.

### Smaller images: investigated, mostly a dead end

Recorded so nobody re-investigates it. LSS's own S3 hosts the same cards at 546x763 for
**60 KB**, a quarter of fabrary's weight, with the alpha channel intact
(`legendstory-production-s3-public.s3.amazonaws.com/media/cards/large/<ID>.webp`).
**That host sends no `Access-Control-Allow-Origin` header.** Three.js sets
`crossOrigin: "anonymous"`, so the browser refuses to let WebGL use the pixels. It is
viewable in a browser tab but not usable as a texture.

Self-hosting re-encoded copies would mean shipping thousands of images with FABKIT
(hundreds of MB), which is worse than the problem. Fabrary offers no width parameter or
smaller variant (`?w=`, `?width=`, `/small/`, `.width-N` all tested; the first two are
ignored, the last two 404).

So the levers are about **when** and **how often** we fetch, not how big each file is.

### Proposed fixes, in value order

1. **Cache card images in the service worker.** FABKIT already ships a PWA
   (`vite-plugin-pwa` in `vite.config.ts`) whose `workbox` config currently sets only
   `cleanupOutdatedCaches` and has **no `runtimeCaching` at all**. Add a `CacheFirst`
   rule for `https://content.fabrary.net/cards/*`. Every card is then downloaded once
   per device rather than once per three days.

   Why this matters more than it sounds: a pack draws 11 or 12 commons from a pool of
   roughly 130 per set, so repeat openings collide constantly. After about ten packs of
   one set, most of that set's commons are already on the device and a new pack costs a
   fraction of 3.3 MB.

   **Cap it explicitly** so it cannot grow without bound: `maxEntries: 600`,
   `maxAgeSeconds: 30 days`, via `expiration` in the workbox plugin config. Do not
   invent different numbers.

2. **Stagger the preload.** Load the first three cards eagerly during the tear, then
   keep two or three ahead of the player as they tap. Same total bytes, but never more
   than a handful in flight, so the pack opens on time instead of stalling. Implement it
   in `stores/pack-opener.ts` (replacing the loop in `preloadPackTextures`) plus
   `advanceReveal`, which is the natural place to request the next one.

3. **Show the Flesh and Blood card back while a card loads.** Change `RealCardFace`'s
   `status === "loading"` branch to render the card back rather than `null`. Removes
   the "is it broken?" moment, and a face-down card waiting to be turned over is exactly
   the right metaphor. Do this in the same commit as item 2, since staggering makes a
   visible loading state more likely, not less.

   **The asset is sourced.** The official card back is at
   `https://content.fabrary.net/cards/cardback.webp`: 300x419, 73.6 KB, alpha channel
   for the rounded corners, `Access-Control-Allow-Origin: *`, cached for a year.
   Verified as the genuine Flesh and Blood back with the TCG logo, not a fallback image.

   **Self-host it, do not hotlink it.** Save it to
   `public/img/pack-opener/card-back.webp` and load it from there. Three reasons: a
   placeholder must never itself be the thing that is loading; self-hosted it gets
   precached by the service worker and works offline; and it removes a third-party
   dependency from a core piece of UI.

   Two caveats to raise with Louis. It is 300x419, half the resolution of a card face
   (600x838), so it will look soft filling the frame. And 73.6 KB is heavy for that
   size, so it is poorly compressed. **Louis has offered to provide his own version.**
   Use this one to build against, and tell him a higher-resolution, better-compressed
   replacement dropped at the same path is a straight swap. Same rounded-corner
   transparency, same aspect ratio (roughly 1:1.4, matching `CARD_WIDTH` /
   `CARD_HEIGHT`).

   The card back is Legend Story Studios artwork. FABKIT already uses their card art
   and set logos throughout, so this is consistent with the existing posture.

4. **Respect the visitor's own data preferences.** If `navigator.connection.saveData`
   is true, or `effectiveType` is `"2g"` or `"slow-2g"`, drop to loading one card ahead
   instead of three. About ten lines, and it targets exactly the people Louis is worried
   about. Feature-detect it; it does not exist in Safari.

5. **Drop or replace `Environment preset="studio"`.** Either tune the existing ambient
   and directional lights until the pack looks right without it, or move `PackMesh` to a
   cheaper material. Removes a third-party runtime dependency and real GPU cost on weak
   devices. **This changes how the unopened pack looks, so it needs Louis's eyes.**

6. **Cap `dpr`.** `<Canvas dpr={[1, 2]}>` renders at up to double pixel density, which
   is four times the pixels on a high-DPI screen. On a laptop with weak integrated
   graphics that is the difference between smooth and not. Consider `[1, 1.5]`. Small
   sharpness trade.

**ASK LOUIS** which of these he wants, at the start of the batch. Items 1 to 4 are wins
with no visual cost. Items 5 and 6 trade appearance for speed and are his call.

Do not attempt all six blind. Measure before and after with the browser's network
throttling set to "Slow 4G" so you can report a real number, not a feeling.

---

# Pack artwork upload spec (for Louis)

He has said he will upload pack artwork. This is the exact spec, derived from
`scripts/build-pack-data.ts`'s `resolvePackArt` and `config/scene.ts`. Give it to him;
do not guess at it.

**Where:** `public/img/pack-opener/packs/<SETCODE>/`

**Set code** is the uppercase code from `config/known-sets.ts`: `WTR`, `ARC`, `CRU`,
`MON`, `ELE`, `EVR`, `1HP`, `UPR`, `DYN`, `OUT`, `DTD`, `EVO`, `HVY`, `MST`, `ROS`,
`HNT`, `SEA`, `SUP`, `PEN`, `OMN`.

**Filenames:** `1.webp`, `2.webp`, `3.webp` and so on. Numbered from 1, **no gaps** —
the script stops at the first missing number, so `1, 2, 4` silently yields only two
artworks. `.webp` only; the filename pattern is matched strictly.

**Multiple artworks per set are supported.** A set with several pack fronts gets one
picked at random per session.

**Dimensions:** the pack mesh is 1.05 wide by 2.0 tall, an aspect ratio of 1:1.905.
Recommended master size **1024 x 1950**, target file size around 200 KB. Minimum useful
size 512 x 975.

> Note a discrepancy: `useRealPackTexture.ts`'s comment documents "one 512x1024 WebP",
> which is 1:2 and would stretch the art vertically by about 5 percent. The
> aspect-correct number above is the right one. Update that comment when you touch the
> file.

**The top 8 percent of the image becomes the tear-off seal.** That is
`PACK_SEAL_HEIGHT / PACK_HEIGHT` = 0.16 / 2.0. At the recommended 1950px height, the
**top 156 pixels** are the strip that rips away. Louis needs this to place the tear line
in his design.

**No transparency needed.** The image maps onto a solid box face, so a WebP without an
alpha channel is correct and smaller.

---


# Deferred, not rejected

Record these so they are not lost:

- **Marvel front and back.** The data supports it (`-MV_BACK` images plus
  `double_sided_card_info`). Louis raised it as a "maybe later".
- **A higher-resolution card back.** The sourced one is 300x419 and poorly compressed.
  Louis may replace `public/img/pack-opener/card-back.webp` at any time; it is a
  straight file swap with no code change.
- **Pack artwork.** `public/img/pack-opener/packs/` is empty, so every set currently
  shows the same canvas-drawn placeholder pack. Louis is uploading artwork; the spec he
  needs is in the section above.
- **Edition fidelity.** The build script does not distinguish First Edition from
  Unlimited printings (`edition` field, `U-` prefixed artwork). A Welcome to Rathe pack
  can currently show Unlimited art.
