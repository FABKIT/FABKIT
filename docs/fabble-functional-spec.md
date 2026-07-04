# Fabble — Functional Specification

**Status:** Approved concept, ready for design/build planning
**Last updated:** 2026-07-04
**Mockups referenced:** the 9 screenshots in `Screenshots Fabble/` (numbered 1–9)

This document describes **what Fabble does and how it looks and behaves** in every situation. It deliberately contains no technical detail — no code, no architecture, no data structures. It is the contract the implementation must fulfill.

---

## 1. What is Fabble?

Fabble is a **daily Flesh and Blood card deduction puzzle** — Wordle, but instead of guessing a word letter by letter, you guess a FAB card and get feedback on its attributes. Each guess reveals how your card compares to the secret daily card across 11 attributes (type, class, cost, pitch, set, and so on). Use the feedback to narrow down the answer before your guesses run out.

Fabble lives inside FABKIT as its own app, alongside the Card Creator, reachable from the main navigation.

### Design principles

- **"Assume FAB knowledge, never assume Fabble knowledge."** The game is for people who know Flesh and Blood. It never needs to teach the card game — but it must always teach itself (clear rules, self-explanatory feedback).
- **One shared ritual.** Every player in the world gets the same card on the same calendar date. Solving it is a shared social moment — that's what makes sharing results fun.
- **Fully on the player's device.** No accounts, no server, no sign-up. Progress, streaks and settings live in the player's browser. Clearing browser data means losing streaks — that's an accepted trade-off.
- **Deduction, not trivia.** Feedback must always be fair and informative. The player should lose because they ran out of deductive skill, never because the game was ambiguous or withheld information.

---

## 2. Game modes

Both modes are available at launch. Each mode has **its own daily card, its own session and its own streaks** — a player can play both puzzles every day.

| | **Standard** | **Chaos** |
|---|---|---|
| **Card pool** | A curated pool of ±350 popular cards from the current competitive meta, refreshed monthly (see §9) | Every printed card of the eligible types — thousands of cards, **including banned ones** |
| **Guesses** | 8 | 12 |
| **Hints** | 2 unlockable hints | None |
| **Theme days** | Yes (see §3) | No |
| **Audience** | Anyone who plays or follows FAB | The most hardcore, encyclopedic FAB fans |

**Eligible card types (both modes):** Hero, Weapon, Equipment, Action, Attack Action, Attack Reaction, Defense Reaction, Instant, Ally.
Everything else (tokens, mentors, resources, demi-heroes, macros, melds, events, block cards, companions) can never be an answer or a guess — they aren't fairly knowable as puzzle answers.

---

## 3. The daily card

- **A new puzzle appears at the player's own local midnight** (like Wordle). Everyone playing on, say, July 4th — wherever they are — gets the same July 4th card. There is no single global "flip moment"; the puzzle follows each player's calendar day.
- **Anti-repeat guarantee:** within a pool, no card is the daily answer twice until every other card in the pool has had its turn. For Standard's ±350 cards that's nearly a year without repeats.
- **A started puzzle is safe.** If the card pool is updated while a player is mid-puzzle, they keep the card they started with. Pool updates only affect puzzles that haven't been started yet.
- **Ambiguous cards are never answers** in Standard. Some cards are indistinguishable from another card across all 11 attributes ("twins", see §5); those are excluded from being the daily answer so the puzzle is always solvable by pure deduction.

### Theme days (Standard only)

Two weekly rituals, **openly announced** to the player with a small banner on the play screen:

- **Equipment Monday** — the daily card is always an Equipment.
- **Class Thursday** — the daily card belongs to a specific class that rotates weekly (Warrior one week, Guardian the next, and so on through the 10 classes).

The banner (e.g. "⚔️ Equipment Monday") appears above the puzzle so players can factor it into their first guess. On all other days there is no banner and the card is unrestricted.

---

## 4. Screens & flows

### 4.1 Home / mode select *(screenshot 1)*

The Fabble landing page shows:

- The Fabble art banner and logo at the top.
- The tagline: *"Daily Flesh and Blood card deduction puzzle."*
- A **"How to Play"** button that opens the rules popup.
- Two mode cards side by side — **Standard** ("A curated selection of popular cards from the current meta · 8 guesses · 2 hints") and **Chaos** ("Every printed card, including banned ones · 12 guesses · No hints") — each with a **Play** button.

### 4.2 Rules popup *(screenshot 7)*

- **Opens automatically on a player's very first visit ever**, and never automatically again.
- Always reopenable via the **question-mark button** on the play screen and via "How to Play" on the home page.
- Content is static written rules (no gameplay screenshots inside the popup), structured as:
  1. **What is Fabble** — one short paragraph.
  2. **Making a guess** — type a name, pick from the dropdown, tiles flip.
  3. **Reading your feedback** — a **mock example row of tiles** showing all six tile states side by side with labels: Match (green), Partial (yellow), No Match (red ✕), Higher (red ↑), Lower (red ↓), Not Applicable (red ban icon). These are illustrative example tiles, not live game data.
  4. **The 11 columns** — one line per column explaining what it compares.
  5. **Game modes** — one line each for Standard and Chaos.

### 4.3 Play screen *(screenshot 2)*

From top to bottom:

1. **Art banner** with the Fabble logo.
2. **"Possible card types" row** — chips listing the 9 eligible types. This is a **static legend describing the pool**: it tells the player "today's answer is one of these types" before they even start. It never changes or reacts to guesses.
3. **Status bar** — a "← Menu" button (back to mode select), a mode badge ("Standard mode" / "Chaos mode"), the guess counter ("Guess 2 of 8"), and the question-mark button (rules).
   *The "Reset" button in the mocks is a development/playtesting tool only — players never see it.*
4. **Theme day banner** — only on Equipment Monday / Class Thursday in Standard (see §3).
5. **Hints row** — Standard only (see §4.6).
6. **Guess input** — a text field ("Type a card name…") with a **Submit Guess** button beneath it, and "X guesses remaining" under that.
7. **The guess history** — every previous guess as a feedback block, newest at the top (see §4.5).

### 4.4 Searching for a card *(screenshot 3)*

- As the player types, a dropdown appears with up to **10 matching cards**. Each row shows the card's thumbnail image, name, and card type.
- Matching is forgiving: **capitalization, accents and apostrophe styles don't matter** — typing "hunters" finds "Hunter's", "Vetrei" finds "Vetreiðr".
- Results are ranked: names **starting with** the typed text come first, names merely **containing** it after.
- Cards come in multiple colors and printings, but the list shows **one entry per card name** — the player guesses "Snatch", never "Snatch (red)".
- **Already-guessed cards** still appear but are visibly disabled (greyed out, with a checkmark) and can't be selected. The same card can never be guessed twice.
- The player selects a card by clicking it (or with arrow keys + Enter), then presses **Submit Guess**. Only real card names can be submitted — free-typed text that matches nothing cannot be guessed.

### 4.5 Feedback after a guess *(screenshots 4 & 8)*

Each submitted guess adds a **feedback block** at the top of the history (newest first). A block contains:

- **Header:** the guessed card's thumbnail (shown in black & white if the guess is wrong), its name with a red ✕ beside it if wrong, and its card type.
- **The tile grid:** 11 tiles, one per attribute — Type, Class, Talent, Pitch, Cost, Power, Defense, Life, Subtypes, Keywords, Set. On desktop they lay out in two rows (6 + 5); on small screens they **wrap into a grid of 3–4 tiles per row** so nothing is ever hidden or requires sideways scrolling.
- **Reveal animation:** on a fresh guess the tiles flip over one by one, left to right, with a short stagger. Guesses restored from an earlier visit render instantly without replaying animations.

Tile colors and marks:

- 🟩 **Green — exact match.**
- 🟨 **Yellow — partial match.** At least one value overlaps (e.g. a shared class or keyword). The overlapping values are shown.
- 🟥 **Red — no match.** For numeric attributes an **arrow** points the way: ↑ means the answer's value is higher, ↓ lower — and the tile also reveals the answer's actual value so the player knows the target. A **ban icon** means the answer has no such attribute at all ("look for a card without this").
- Additionally, every tile carries a small **state icon** alongside its color (✓ match, ≈ partial, ✕ no match) so the game stays readable for colorblind players. Arrows and ban icons keep their own meanings and are never repurposed.

After each guess the counter updates in both places ("Guess 3 of 8" and "5 guesses remaining").

**The twin-card rule (free retry):** rarely, a guess matches the answer on all 11 attributes but is still the wrong card (a "twin" — most likely in Chaos). When that happens the game shows a clear message — *"So close! Same properties, different card…"* — and **the guess is not spent**: the guess counter does not advance. The all-green block stays visible in the history with a "twin" note so the player can see what they matched. The player deduced everything the game can measure; they are never punished for the game's own blind spot.

### 4.6 Hints (Standard only) *(screenshot 2)*

A row of two hint buttons above the input:

- **Hint 1 — the card's rarity.** Locked until the player has made 3 guesses.
- **Hint 2 — the card's earliest set.** Locked until 5 guesses.

Each button has three states: **locked** (padlock + "After guess 3"), **available** (an unlock button the player must actively click — hints are never revealed automatically), and **revealed** (the hint text shown in place). Revealed hints stay revealed for the rest of the session and are counted on the share card ("Hints used: 1/2").

### 4.7 Victory *(screenshot 5)*

When the guess is correct, the final guess's tiles flip all-green, and after the animation finishes the end panel fades in:

1. **"VICTORY"** title.
2. **The answer card, large**, with an animated glow fading in around it. Beside it: the card's name, rarity (with rarity icon), the set it appeared in, and artist credit.
3. The mode badge and **"You got it in X guesses!"**
4. **Current streak and best streak** for this mode.
5. **Share block:** an optional username field ("Add your name to the share card", max 20 characters, remembered on this device for next time, "not stored anywhere else") and the **Share Result** button (see §7).
6. **"Next puzzle in HH:MM:SS"** — a live countdown to the player's local midnight. When it reaches zero it becomes a **"New puzzle available"** button that starts the next day's puzzle.
7. Scrolling down, the full guess history remains visible, newest first.

### 4.8 Defeat *(screenshot 9)*

Identical layout to Victory, with these differences:

- The title reads **"DEFEAT"**.
- The reveal reads "The card was…" followed by the answer card (same large display with name, rarity, set, artist).
- The current streak shows 0 (a loss resets it — see §6); best streak is unchanged.
- Sharing still works — sharing a loss is allowed and the share card shows the failed result.

### 4.9 Leaving and returning

A puzzle in progress is never lost:

- Navigating away (to the Card Creator, another mode, or closing the browser) and returning **restores the session exactly** — same guesses, same feedback, same hints revealed — as long as it's still the same calendar day.
- A finished puzzle shows its end screen (Victory/Defeat) for the rest of the day; the player cannot replay it.
- On a new day, the previous session is gone and a fresh puzzle starts.
- Screen changes (menu → puzzle → end panel) use smooth fade transitions rather than hard cuts.

---

## 5. The 11 feedback columns

| # | Column | Compares | Green when | Yellow when | Red details |
|---|--------|----------|------------|-------------|-------------|
| 1 | **Type** | Card type (Action, Hero, Equipment…) | Types identical | — (never partial) | Plain red |
| 2 | **Class** | Class(es) (Warrior, Ninja, Generic…) | Same class(es) | Any shared class (e.g. Warrior vs Warrior/Ninja) | Ban icon if the answer has no class at all |
| 3 | **Talent** | Talent(s) (Draconic, Light, Shadow…) | Same talents — including *both having none* (that's a real match) | Any shared talent | Ban icon if the answer has no talent but the guess does |
| 4 | **Pitch** | Pitch color: red (1), yellow (2), blue (3), or none | Guess's pitch exists on the answer; both having no pitch also matches | — | Plain red |
| 5 | **Cost** | Resource cost | Equal | — | ↑/↓ + the answer's actual value; ban icon if the answer has no cost |
| 6 | **Power** | Attack power | Equal | — | ↑/↓ + actual value; ban icon if not applicable |
| 7 | **Defense** | Defense value | Equal | — | ↑/↓ + actual value; ban icon if not applicable |
| 8 | **Life** | Life total — Heroes compare their **life** (intellect is not used anywhere), Allies their life | Equal | — | ↑/↓ + actual value; ban icon for every card that has no life value |
| 9 | **Subtypes** | Subtypes (Attack, Arrow, Trap…) | Identical sets — both having none also matches | Any overlap; the shared subtypes are shown | Plain red |
| 10 | **Keywords** | Keywords (Go again, Dominate…) | Identical sets — both having none also matches | Any overlap; the shared keywords are shown | Plain red |
| 11 | **Set** | All sets the card was printed in | **Any** printing of the guess is also a printing of the answer (reprint-generous — the player never needs to know which printing came first) | — | The tile lists the guess's printings newest → oldest, each with its own ↑ (answer is from a newer set) or ↓ (older) arrow |

Special rules that cut across columns:

- **Rainbow cards** (printed in red, yellow *and* blue): the Pitch tile is always green for them, displaying "All colors" instead of a number — a rainbow card is technically every pitch. Knowing this, guessing a rainbow card early is a legitimate strategy to probe the answer's pitch.
- **Odd values:** some cards have "X" cost or "\*" power. These are never compared directionally — a "3 cost vs X cost" tile is simply red with no arrow. Arrows only appear when both cards have real numbers.
- **"Not applicable" is information.** A ban icon tells the player the answer *lacks* that attribute entirely — e.g. no cost tile on a Hero — which is itself a strong clue. Two cards both lacking an attribute count as a green match.

---

## 6. Streaks & what the device remembers

**Streak rules (per mode, Wordle-strict):**

- Winning today when you also solved yesterday → current streak +1.
- Winning today after **not solving yesterday** (skipped or lost) → current streak restarts at 1.
- Losing today → current streak resets to 0 immediately.
- **Best streak** only ever goes up; a broken streak never lowers it.
- Standard and Chaos streaks are completely independent.

**Remembered on the player's device (nothing leaves the browser):**

| What | Behavior |
|---|---|
| Today's session, per mode | Guesses, feedback, status, hints revealed — restored on return, discarded after the day ends |
| Streaks, per mode | Current + best |
| Share username | Max 20 characters, optional, pre-filled next time |
| "Seen the rules" flag | So the rules popup only auto-opens once, ever |

If saving fails (private browsing, full storage), the game still plays normally — it just can't remember across visits. It never blocks play or shows errors about it.

---

## 7. Sharing *(screenshot 6)*

The **Share Result** button produces a branded **share image (PNG)**:

- Header: mode + date (e.g. "Standard mode · 04-07-26") over the Fabble art banner and logo.
- The player's username (if entered) and the result line: *"solved today's Fabble in **5/8**"* (or a defeat line, e.g. "couldn't solve today's Fabble") and "Hints used: 1/2" when applicable.
- The full result grid: one row per guess, 11 squares per row, colored **green / yellow / red** exactly like the real tiles — including yellow for partials. *(Note: mock 6 shows only green/red; yellow must be added.)* Attribute values are never shown — only colors, so shares never spoil the answer.
- Footer: "A daily Flesh and Blood deduction puzzle · Powered by Fabkit.io".
- The grid compresses politely when there are many guesses so everything always fits on the card.

**Delivery:** on mobile the button opens the native share sheet with the image; on desktop it copies the image / offers a download. A secondary **"Copy as text"** option produces a Wordle-style emoji grid (🟩🟨🟥 rows plus a one-line header with mode, date, score and a link) for text-first places like Discord and Reddit.

---

## 8. Accessibility & languages

- **Color is never the only signal:** every tile carries a state icon (✓ / ≈ / ✕) in addition to its color; arrows and ban icons keep distinct meanings.
- Every tile has a **screen-reader description** ("Class: partial match — shared class Warrior").
- The dropdown, hints and dialogs are fully keyboard-operable.
- All of Fabble's interface text is **translatable**, following FABKIT's existing multi-language setup. Card names, sets, classes and other FAB vocabulary stay in English — they are game terms.

---

## 9. Content operations (the curator's view)

Fabble needs light monthly upkeep by the FABKIT team; players never see any of this.

- **Monthly Standard pool refresh:** around each new FAB set release, the ±350-card Standard pool is regenerated from **current competitive popularity data** (which cards actually see play across the meta's decks). The pool is automatically balanced across card types, rarities and classes — so it isn't 80% commons or dominated by one class — and **banned cards are excluded**. The curator reviews a summary of the new pool before publishing.
- **Admin override:** the curator can manually exclude or force-include specific cards when the automatic selection needs correcting. Curation is automatic by default, human-adjustable by exception.
- **Continuity on update:** publishing a new pool never disrupts players — the daily sequence continues seamlessly and in-progress puzzles keep their card (§3).
- **Chaos needs no curation** — it always includes every eligible printed card; it only grows as new sets are added.

---

## 10. Explicitly out of scope for v1

Discussed and deliberately deferred — not part of this spec:

- **Archive** of past puzzles (miss a day, it's gone).
- **Stats block** beyond streaks (games played, win %, guess histogram).
- **Ranked / timed modes** with score multipliers and leaderboards.
- **Global community stats** ("63% of players solved this") — requires a server.
- **Art-reveal mode** (guess the card from progressively unblurring art).
- **Any server or account system.**

---

## 11. Corrections to the mockups

The screenshots are the visual reference, with these known deviations:

1. The concept document's "8 guesses, **3 hints**" heading is a typo — it's **2 hints**, as the mocks show.
2. The share-card mock (screenshot 6) lacks **yellow** partial squares — the real share grid uses green/yellow/red.
3. The **"Reset"** button on the play screen mocks is a development-only tool and does not ship to players.
4. Tiles gain the small always-on **state icons** described in §4.5/§8, which the mocks don't show yet.
5. The **"Life / INT"** column is simply **"Life"** — intellect is not used (§5, column 8).
