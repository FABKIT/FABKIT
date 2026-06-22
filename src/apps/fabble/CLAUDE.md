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

The `$mode` route loader imports `@flesh-and-blood/cards` at runtime (lazy chunk, ~9MB), builds the search pool via `pool.ts`, then calls `useFabbleStore.getState().initMode()` before the component renders. The daily card is selected deterministically from `lib/standardSelection.g.ts` (Standard) or the full pool (Chaos) using a PRNG seeded by date — no server call required.

## Data Flow

```
@flesh-and-blood/cards (npm dep, lazy)
  → route loader: buildStandardSearchPool / buildChaosPool
  → initMode(searchPool, dailyPool, poolVersion)
    → selectDaily(dailyPool, today) → DailyCard
    → initSession(mode, today, poolVersion, daily) → SessionState (from localStorage)
    → fabbleStore hydrated with guesses, status, streak
      → useFabbleGame hook (granular selectors)
        → GuessGrid / GuessInput / HintPanel (React)
```

## Local Development

No Cloudflare Worker needed to run the puzzle. The worker is only required to validate admin tokens for the `fabble-admin` companion repo. Everything needed to play locally:

```sh
bun install
bun dev
# Open http://localhost:5173/fabble
```

The generated files `lib/setOrder.g.ts` and `lib/standardSelection.g.ts` hold curated/generated data. `standardSelection.g.ts` requires human review before deployment; update it from the `fabble-admin` companion repo and commit the result.

## Pool Files

`public/pool-standard.json` and `public/pool-chaos.json` are no longer used. Card data is imported directly from `@flesh-and-blood/cards` at runtime and split into its own lazy JS chunk (`fab-cards`) excluded from PWA precaching.

## Import Rules

- `./ComponentName` (same-directory) relative imports are fine.
- Any import that traverses directories (`../../`) must use `@fabkit/apps/fabble/*` instead.
- Platform utilities are imported via `@fabkit/platform/*`.
- Shared utilities are imported via `@fabkit/shared/*`.
- Route files import app components via `@fabkit/apps/fabble/*`.
- Never import from other apps.
