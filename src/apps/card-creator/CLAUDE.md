# Card Creator App

The card-creator app is the FAB card design and rendering tool. It lets users compose
custom Flesh and Blood cards by selecting card types, styles, artwork, and text, then
renders them as SVG previews that can be exported as PNG.

## Structure

```
src/apps/card-creator/
  components/
    card-creator/      # Field components, renderer, hooks
    gallery/           # Gallery thumbnails and file upload
    home/              # Home page card-type picker and featured artist
    utils.ts           # Field visibility helpers (useIsFieldVisible, isFieldVisible)
  config/
    rendering/         # SVG render config presets and types (preset.tsx, meld_preset.tsx, types.ts)
    rendering.ts       # AllRenderConfigVariations record + RenderConfigVariation type
    contact.ts         # Social/contact links
    roadmap.ts         # Roadmap items (currentWorkItems, futurePlans)
    featured_artist.tsx# Featured artist showcase data
    editor.ts          # Tiptap editor configuration
  persistence/
    card-storage.ts    # Dexie IndexedDB storage; CRUD, serialize/deserialize, import/export
    migrations.ts      # Migration interface
    migrations/        # Per-version data migrations
  stores/
    card-creator.ts    # Zustand store (useCardCreator)
  index.ts             # App entry — registers bug-report data provider
```

## Store Shape

`useCardCreator` (Zustand + devtools) top-level fields:

- `CardType` — selected card type (`CardType | null`)
- `CardBack` — selected card back config object (`CardBack | null`)
- `CardBackStyle` — visual style variant (`CardStyle`)
- `CardArtwork`, `CardArtPosition` — artwork blob and position/scale
- `CardArtworkCredits`, `CardSetNumber` — text fields (uppercased)
- `CardTextHTML`, `CardTextNode` — rich text in HTML and Tiptap Content forms
- `CardPitch`, `CardName`, `CardResource`, `CardPower`, `CardTalent`, etc. — standard form fields
- `CardOverlay`, `CardOverlayOpacity` — optional overlay image
- `meldActiveHalf`, `meldHalfA`, `meldHalfB` — meld card state (`MeldHalf`)
- `__version` — UUID updated on reset; used for persistence cache-busting

## Import Rules

- App components import from `@fabkit/platform/*` and `@fabkit/shared/*` only — never from other apps.
- Relative imports that stay within `src/apps/card-creator/` are fine.
- Route files in `src/routes/` import app components via `@fabkit/apps/card-creator/*`.

## Renderer Gotcha

CSS files in `components/card-creator/Renderer/NormalRenderer.tsx` use a relative
path to `src/styles/` (`../../../../../styles/components/normal-renderer.css`).
This is acceptable and no action is needed until styles are reorganised.
