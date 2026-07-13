# Fabble App

Fabble is a daily Flesh and Blood card deduction puzzle (Wordle-like), shipping as a
full app inside FABKIT's multi-app platform. Two modes: Standard (curated pool, 8
guesses, 2 hints) and Chaos (every eligible card including banned ones, 12 guesses,
no hints/themes).

## Data contract

The binding dataset shape lives in `types.ts` (`FabbleDataset`, `FabbleCard`,
`FabbleScheduleEntry`). It's produced by a separate card-data repo (schedule,
pool curation, banned-card exclusion, set `order` semantics) — Fabble only fetches
and looks up. Until the real feed exists, `public/fabble-sample-data.json` is a
hand-authored ~30-card fixture with the same schema; the fetch URL is the single
`FABBLE_DATA_URL` constant in `config.ts`.

## Structure

```
src/apps/fabble/
  types.ts                Dataset schema, comparison types (ColumnFeedback, GuessResult),
                           persisted-storage shapes (PersistedSession, PersistedStreaks)
  config.ts                Game constants (guess limits, hint thresholds, timings)
  data/load-dataset.ts     Fetch + validate + Cache API offline fallback
  game/                    Pure logic, no React — normalize, date, daily (schedule
                           lookup), compare (the 11-column engine), search, storage
                           (safeStorage wrapper), streaks, share-text
  stores/fabble.ts         Single Zustand store, mode-keyed sessions
  components/              UI — see Store Shape below for how they connect
  hooks/useCountdown.ts    Live countdown to local midnight
  i18n/en.json             Namespace "fabble"
  index.ts                 App entry — registers the bug-report provider (answerId
                           redacted so a bug report never spoils today's answer)
```

## Store Shape

`useFabbleStore` (Zustand + devtools) top-level fields:

- `dataset`, `cardsById`, `searchIndex` — set once via `ingestDataset()` from the
  route loader's data
- `sessions: Partial<Record<FabbleMode, ModeSession>>` — one session per mode.
  `ModeSession.order` holds every guess id (spent + twin) in real submission order,
  since spent guesses and twins live in separate arrays and don't interleave on
  their own — use `getOrderedResults(session)` to merge them back
- `streaks: Partial<Record<FabbleMode, PersistedStreaks>>`
- `username`, `hasSeenRules`, `hasSeenRainbowHint` — cross-mode player prefs

Key actions: `startOrRestoreSession` (hydrates from `safeStorage` if the persisted
session matches today, else starts fresh and persists immediately — this is the
started-puzzle safety net), `submitGuess` (routes an all-green wrong guess to the
twin list instead of spending a guess), `revealHint`, `advanceToNewDay` (just
re-runs `startOrRestoreSession` once the date has rolled over), `devReset`
(DEV-only; clears only Fabble's own `STORAGE_KEYS`, never all of localStorage).

Feedback (`GuessResult[]`) is never persisted — it's recomputed from
`guesses: string[]` + `answerId` via `compareCards()` on every restore.

## Comparison rules (rainbow cards)

Rainbow cards (printed in red/yellow/blue with different stats per colour) are merged
into one `FabbleCard` whose numeric fields (`pitches`, `costs`, `powers`, `defenses`)
hold the union of values across colours. `compare.ts` requires an EXACT value-set match
for green on these columns: a mono guess against a multi-value answer (or vice versa) is
yellow (`partial`), not green, even if one value overlaps. Arrows on a numeric miss only
appear when every one of the answer's values is fully higher or fully lower than every
one of the guess's values; there is no `revealedValue` field, a miss never reveals the
answer's actual numbers. The `game/rainbow-hint.ts` helper (`hasRainbowPartial`) detects
this partial state to drive the one-time in-play hint toast (`hasSeenRainbowHint` /
`markRainbowHintSeen`, plumbed exactly like `hasSeenRules`).

## Import Rules

- App components may import from `@fabkit/platform/*` and `@fabkit/shared/*`.
- App components must NOT import from other apps (`@fabkit/apps/card-creator/*`, etc.).
- Route files in `src/routes/` import app components via `@fabkit/apps/fabble/*`.
- Routing is hash-based (`createHashHistory` in `src/platform/router.tsx`, for
  GitHub Pages) — local URLs are `/#/fabble/...`, not `/fabble/...`.

## Known fixture quirks

`public/fabble-sample-data.json` fictionalizes a twin pair (`whispering-mists` /
`echoing-mists` — two invented cards sharing every comparable attribute) since no
two real cards in the small sample fit naturally. Card `imageUrl`/`thumbnailUrl`
point at placehold.co placeholders, not a real card-image CDN — swap
`FABBLE_DATA_URL` in `config.ts` once the real feed exists.
