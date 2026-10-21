# Card Creator App

The card-creator app is the FAB card design and rendering tool. It lets users compose
custom Flesh and Blood cards by selecting card types, styles, artwork, and text, then
renders them as SVG previews that can be exported as PNG.

## Structure

```
src/apps/card-creator/
  components/
    card-creator/      # Field components, renderer, hooks
    custom-frames/     # Custom frame tiles and the upload dialog (shared with the picker)
    gallery/           # Gallery thumbnails and file upload
    home/              # Home page card-type picker and featured artist
    utils.ts           # Field visibility helpers (useIsFieldVisible, isFieldVisible)
  config/
    rendering/         # SVG render config presets and types (preset.tsx, meld_preset.tsx, types.ts)
    rendering.ts       # AllRenderConfigVariations record + RenderConfigVariation type
    featured_artist.tsx# Featured artist showcase data
    editor.ts          # Tiptap editor configuration
  persistence/
    card-storage.ts    # Dexie IndexedDB storage; CRUD, serialize/deserialize, import/export
    migrations.ts      # Migration interface
    migrations/        # Per-version data migrations
  preset-link/
    preset-link.ts      # Parses/validates a preset-link payload, applies it via loadCard
    build-preset-link.ts# Reverse direction — current form state -> preset-link payload/URL
    resolve.ts          # Looks up a preset link's stock CardBack reference by id
    artwork.ts          # Fetches a preset link's CardArtwork URL, under its network guards
    artwork-fit.ts      # Fits that artwork to the frame's open area (measured from the frame image)
  stores/
    card-creator.ts    # Zustand store (useCardCreator)
  index.ts             # App entry — registers bug-report data provider
```

## Store Shape

`useCardCreator` (Zustand + devtools) top-level fields:
- `CardType` — selected card type (`CardType | null`)
- `CardVariant` — which variant of that card type (`CardVariant | null`); `null` is the
  standard version. Only meaningful together with `CardType`; set through `setCardType`
- `CardBack` — selected card back config object (`CardBack | null`)
- `CardBackRight` — right-half card back for hybrid frames (`CardBack | null`); non-null
  is what makes a card hybrid, there is no separate boolean flag. Excluded for meld.
- `CardBackStyle` — visual style variant (`CardStyle`)
- `CardBackSplit`, `CardBackBlend` — hybrid seam position (fraction of width) and
  softness (0..1)
- `CardArtwork`, `CardArtPosition` — artwork blob and position/scale
- `CardArtworkCredits`, `CardSetNumber` — text fields (uppercased)
- `CardTextHTML`, `CardTextNode` — rich text in HTML and Tiptap Content forms
- `CardPitch`, `CardName`, `CardResource`, `CardPower`, `CardTalent`, etc. — standard form fields
- `CardOverlay`, `CardOverlayOpacity` — optional overlay image
- `meldActiveHalf`, `meldHalfA`, `meldHalfB` — meld card state (`MeldHalf`)
- `__version` — UUID updated on reset; used for persistence cache-busting

## Card Variants

A card is described by two coordinates: `CardType` ("what kind of card", e.g. equipment)
and `CardVariant` ("which version of it", e.g. Evo action). `CardVariant` is `null` for the
standard version, which is every card unless its type lists variants in
`src/shared/config/cards/variants.ts`. Only Equipment has variants today (the two Evo ones).
- Each variant carries what differs from its type's standard version: the word printed on the
  type line, the Variant dropdown label, form fields, subtypes and frame families.
- Always ask through the helpers in `src/shared/config/cards/card_definition.ts`
  (`getCardFields`, `getCardSubtypes`, `getCardTypeLabel`, `getCardBackTypesForCardType`, ...).
  Never read `CardVariants` directly, and never special-case a card type to decide whether it
  has variants: derive it from the config.
- `setCardType(type, variant)` is the only way to change either coordinate, including
  switching only the variant. It normalizes the variant and uses the **new** one for field
  clearing, subtype reset and frame resolution, never `state.CardVariant` (the old one).
- Saved cards, imported files and bug reports are untrusted: `deserializeCardState` runs
  `normalizeCardType` / `normalizeVariant`, so an unknown type opens as Action and an invalid
  variant reads as the standard version. Records saved before variants existed simply have no
  `CardVariant` and read as `null`, so adding a variant needs no migration.
- `STANDARD_VARIANT` in `variants.ts` is a stand-in for `null` where a string is required
  (the Variant dropdown's option values). It is never stored.

### Adding a variant to a card type

1. Add an entry under that type in `src/shared/config/cards/variants.ts` (`standardLabel` if it
   is the type's first variant, then the variant's `uiLabel`, `printedLabel`, `fields`,
   `subtypes`, `cardBackTypes`). The Variant dropdown, saving, share links, frame filtering and
   field visibility all pick it up automatically.
2. Add the i18n keys for every label in `src/apps/card-creator/i18n/en.json`.
3. If the variant uses its own frames: upload them in the admin tool under the frame category
   named in `cardBackTypes`, with a `renderer` key that exists in `AllRenderConfigVariations`.
   **Register the renderer in the app before the frames go live**, or cards with that frame
   render blank.
4. Variant keys must be unique within their card type, never be `STANDARD_VARIANT` (`"standard"`;
   the compiler rejects it), and are permanent: they are saved in card files and share links.
5. **Meld halves have no variant.** If the card type can be a meld half (it is not in
   `MELD_EXCLUDED_TYPES`), the new variant is not selectable inside a meld card until
   `MeldHalf` gets a `CardVariant` too. That is a separate change touching `MeldHalf`,
   `defaultMeldHalf`, `MeldHalfFields.tsx`, `MeldRenderer.tsx`, the preset-link meld schema and
   a migration.
6. Every card type is assumed to have a standard (`null`) version. A type that should exist
   _only_ as variants needs the model extended first.
7. Run the tests. The data-driven ones adapt to the new entry by themselves; add a test for the
   new variant's own fields, subtypes and frames.

## Import Rules

- App components import from `@fabkit/platform/*` and `@fabkit/shared/*` only — never from other apps.
- Relative imports that stay within `src/apps/card-creator/` are fine.
- Route files in `src/routes/` import app components via `@fabkit/apps/card-creator/*`.

## Renderer Gotcha

CSS files in `components/card-creator/Renderer/NormalRenderer.tsx` use a relative
path to `src/styles/` (`../../../../../styles/components/normal-renderer.css`).
This is acceptable and no action is needed until styles are reorganised.
