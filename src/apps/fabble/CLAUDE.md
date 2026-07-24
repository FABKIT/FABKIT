# Fabble App

Fabble is a daily Flesh and Blood card deduction puzzle (Wordle-like), shipping as a
full app inside FABKIT's multi-app platform. Three modes: Standard (curated pool, 8
guesses, 2 hints, schedule-driven daily puzzle) and Chaos (every eligible card
including banned ones, 12 guesses, no hints/themes, also schedule-driven) share the
same daily-puzzle machinery and `FabbleMode` type (`config.ts`'s `MODES`). Endless
(unlimited guesses, no daily schedule, no share card) is deliberately NOT part of
`FabbleMode` — it picks a random card client-side from the same universe Chaos uses
and tracks a session-scoped "consecutive wins" streak instead of a date-keyed one.
See `config.ts`'s `ENDLESS_MODE`/`ALL_MODES`/`MODE_ROUTES` for how the three are
wired together in UI that needs to iterate all of them.

## Data contract

The binding dataset shape lives in `types.ts` (`FabbleDataset`, `FabbleCard`,
`FabbleScheduleEntry`). It's produced by a separate pipeline repo,
[FABKIT/fabble-admin](https://github.com/FABKIT/fabble-admin) (schedule, pool
curation, banned-card exclusion, set `order` semantics) — Fabble only fetches
and looks up. In production the dataset is fetched from
`https://fabkit.github.io/fabble-data/v1/dataset.json`, a public repo
([FABKIT/fabble-data](https://github.com/FABKIT/fabble-data)) that
fabble-admin's weekly GitHub Action publishes to. In dev,
`public/fabble-sample-data.json` is a hand-authored ~30-card fixture with the
same schema instead — see `config.ts`'s `FABBLE_DATA_URL` for the swap.

`FabbleSetPrinting.limitedPrint` (optional) flags Blitz Deck / Commander/CC Deck
printings — real chronological printings (unlike `promo`, they still get normal
Set-tile arrows) that should nonetheless never be picked as a card's *display*
printing on the end screen or Hint 2. `game/compare.ts`'s `earliestRegularPrinting`
is a 3-tier fallback (main sets → non-promo incl. limitedPrint → everything incl.
promo) and treats the field's absence as "no limited-print sets", so it's safe to
consume ahead of fabble-admin actually publishing it.

## Structure

```
src/apps/fabble/
  types.ts                Dataset schema, comparison types (ColumnFeedback, GuessResult),
                           persisted-storage shapes (PersistedSession, PersistedStreaks,
                           PersistedEndlessSession, PersistedEndlessStreak)
  config.ts                Game constants (guess limits, hint thresholds, timings, the
                           MODES/ENDLESS_MODE/ALL_MODES/MODE_ROUTES mode wiring)
  data/load-dataset.ts     Fetch + validate + Cache API offline fallback
  game/                    Pure logic, no React — normalize, date, daily (schedule
                           lookup), endless (random card pick with no-repeat), compare
                           (the 11-column engine + earliestRegularPrinting's set-priority
                           fallback), search, storage (safeStorage wrapper), streaks
                           (both date-keyed applyResult and endless's
                           recordEndlessWin/resetEndlessStreak), share-text
  stores/fabble.ts         Single Zustand store: mode-keyed daily sessions/streaks PLUS
                           a separate endlessSession/endlessStreak slice (see Store Shape)
  components/              UI — see Store Shape below for how they connect. Components
                           prefixed `Endless*` are Endless-only variants of the daily-
                           mode equivalent (EndlessPlayScreen vs PlayScreen,
                           EndlessCardSearchInput vs CardSearchInput, etc.) rather than
                           branches inside the shared component — the two flows diverge
                           enough (different store slice, no guess cap, no schedule) that
                           forcing one component to cover both got unwieldy fast.
                           AnswerReveal (image + name/rarity/set/artist, with a
                           bottomContent slot for the rest of the panel) and
                           ModeSwitchButtons are shared by both EndPanel and
                           EndlessEndPanel.
  hooks/useCountdown.ts    Live countdown to local midnight
  i18n/en.json             Namespace "fabble"
  index.ts                 App entry — registers the bug-report provider (answerId
                           redacted, for both daily sessions and endlessSession, so a
                           bug report never spoils an in-progress answer)
```

## Store Shape

`useFabbleStore` (Zustand + devtools) top-level fields:

- `dataset`, `cardsById`, `searchIndex` — set once via `ingestDataset()` from the
  route loader's data
- `sessions: Partial<Record<FabbleMode, ModeSession>>` — one session per mode.
  `ModeSession.order` holds every guess id (spent + twin) in real submission order,
  since spent guesses and twins live in separate arrays and don't interleave on
  their own — use `getOrderedResults(session)` to merge them back
- `streaks: Partial<Record<FabbleMode, PersistedStreaks>>` — date-keyed, "played every day"
- `dismissedThemeDate: Partial<Record<FabbleMode, string>>` — per-mode, per-date so a
  Monday dismissal doesn't hide the following Thursday's theme banner too
- `endlessSession: EndlessSession | null` / `endlessStreak: PersistedEndlessStreak` —
  Endless's own slice, deliberately NOT keyed by `FabbleMode`/mixed into `sessions`/
  `streaks` above: no date, no guess cap, and the streak means "consecutive wins this
  session" rather than "played every day". Still honors the twin free-retry rule
  (`EndlessSession.twinGuesses`/`order`, merged back via `getOrderedEndlessResults`).
- `username`, `hasSeenRules`, `hasSeenRainbowHint` — cross-mode player prefs

Key actions (daily modes): `startOrRestoreSession` (hydrates from `safeStorage` if the
persisted session matches today, else starts fresh and persists immediately — this is
the started-puzzle safety net), `submitGuess` (routes an all-green wrong guess to the
twin list instead of spending a guess), `revealHint`, `dismissTheme`, `advanceToNewDay`
(just re-runs `startOrRestoreSession` once the date has rolled over), `devReset`
(DEV-only; clears only Fabble's own `STORAGE_KEYS`, never all of localStorage).

Key actions (Endless): `startOrRestoreEndless` (same hydrate-else-fresh shape as
`startOrRestoreSession`, no date check), `submitEndlessGuess` (same twin-routing as
`submitGuess`; on a correct guess calls `recordEndlessWin` and never sets a "lost"
status), `giveUpEndless` (calls `resetEndlessStreak`, clearing `current` and
`completedLog` but keeping `best`), `nextEndlessPuzzle` (picks a new card excluding
the current streak's answers, explicitly NOT `advanceToNewDay`).

Feedback (`GuessResult[]`) is never persisted — it's recomputed from
`guesses: string[]` + `answerId` via `compareCards()` on every restore, for both the
daily sessions and `endlessSession`.

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

`public/fabble-sample-data.json` (dev only) fictionalizes a twin pair
(`whispering-mists` / `echoing-mists` — two invented cards sharing every
comparable attribute) since no two real cards in the small sample fit
naturally. Card `imageUrl`/`thumbnailUrl` point at placehold.co placeholders,
not the real card-image CDN — the production feed uses real
`content.fabrary.net` URLs.
