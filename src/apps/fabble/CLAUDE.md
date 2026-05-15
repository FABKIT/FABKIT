# Fabble App

Fabble is the FAB deck-builder and card browser for FABKIT. It will allow users to
browse and search cards from the Flesh and Blood card database, build and save decks,
and share deck lists.

## Status

This is a scaffold. All implementation is future work. Only the route, i18n namespace,
and bug-report provider registration exist currently.

## Architecture

Fabble follows the same three-layer pattern as card-creator:

- **`components/`** — React UI components for this app
- **`i18n/`** — Per-language translation JSON files (namespace: `"fabble"`)
- **`index.ts`** — App entry point; registers the bug-report data provider as a side effect

## Import Rules

- App components may import from `@fabkit/platform/*` and `@fabkit/shared/*`.
- App components must NOT import from other apps (`@fabkit/apps/card-creator/*`, etc.).
- Route files in `src/routes/` import app components via `@fabkit/apps/fabble/*`.
