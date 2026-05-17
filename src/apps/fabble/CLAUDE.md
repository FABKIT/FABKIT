# Fabble App

Fabble is a daily Wordle-style card deduction puzzle for Flesh and Blood. A new card is chosen each day; players guess by name and receive attribute-level feedback (match / partial / no-match) for 11 columns until they identify the card.

## Architecture

```
src/apps/fabble/
  components/          # React UI components
    FabbleHeader.tsx   # Art banner + logo
    ModeSelect/        # Landing page — ModeCard, ModeSelect
    Puzzle/            # Game board — GuessInput, GuessGrid, GuessCard, FeedbackTile,
                       #              AutocompleteDropdown, AutocompleteItem,
                       #              HintPanel, PuzzleToolbar
    PostSolve/         # End-game — PostSolvePanel, CardReveal, Countdown,
                       #             ShareButton, ShareCard, StreakStats
    Rules/             # How-to-play modal — RulesModal, RulesContent, TileExampleRow
  hooks/               # React hooks (game logic adapters)
    useFabbleGame.ts   # Main game hook — wraps store + lib
    useAutocomplete.ts # Typeahead input logic
    useCountdown.ts    # Time-until-next-puzzle
    useShareImage.ts   # DOM snapshot for share card
    useShareResult.ts  # Share text + clipboard
  lib/                 # Pure TypeScript — zero React imports
    types.ts           # All types (FabbleMode, CanonicalCard, DailyCard, etc.)
    constants.ts       # Game config (guess limits, set order, CDN base, etc.)
    feedback.ts        # evaluateGuess() — core tile-state logic
    selection.ts       # selectDaily() — deterministic PRNG card selection
    session.ts         # Session lifecycle + localStorage persistence
    hints.ts           # Hint generation (Standard mode)
    autocomplete.ts    # Pool search / typeahead
    displayValues.ts   # Value formatting for tile display
    rotations.ts       # Theme day rotations (Monday = Equipment, etc.)
    pool.ts            # Pool filtering (filterForStandard, filterForChaos)
    solver.ts          # Card fingerprinting / collision detection
  stores/
    fabbleStore.ts     # Zustand store — game state + actions
  scripts/
    build-pool.ts      # Generates public/pool-standard.json + pool-chaos.json
                       # Run with: bun run build:pool
  i18n/
    en.json            # All Fabble translations (namespace: "fabble")
  index.ts             # App entry point; registers bug-report data provider
```

## Routes

| File | URL | Purpose |
|------|-----|---------|
| `src/routes/fabble.tsx` | `/fabble/*` | Layout wrapper (Outlet) |
| `src/routes/fabble.index.tsx` | `/fabble` | Mode select landing |
| `src/routes/fabble.$mode.tsx` | `/fabble/standard`, `/fabble/chaos` | Puzzle page + loader |

The `$mode` route loader fetches the pool JSON and calls `useFabbleStore.getState().initMode()` before the component renders.

## Pool Files

`public/pool-standard.json` and `public/pool-chaos.json` are pre-built assets (~1.5 MB each) generated from `@flesh-and-blood/cards`. Regenerate with `bun run build:pool`.

## Import Rules

- Components import lib/hooks/stores via relative paths within this app.
- Platform utilities are imported via `@fabkit/platform/*`.
- Shared utilities are imported via `@fabkit/shared/*`.
- Route files import app components via `@fabkit/apps/fabble/*`.
- Never import from other apps.
