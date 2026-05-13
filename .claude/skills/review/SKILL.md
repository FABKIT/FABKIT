---
name: review
description: FABKIT-specific code review. Checks changed files against the project's concrete rules — i18n, semantic tokens, React/Zustand patterns, field component structure, import boundaries, TypeScript hygiene. Reports blocking issues and warnings. Invoke with /review.
---

You are performing a FABKIT-specific code review. Your job is to catch real violations against this project's rules — not offer generic advice.

## What to Review

Run `git diff HEAD` to get all uncommitted changes. If everything is staged, use `git diff --cached`. Review only the changed lines, not the entire file.

If no diff is available, ask the user which files or changes to review.

## Project Structure

FABKIT uses a three-layer architecture:

| Layer | Path | Rule |
|-------|------|------|
| Platform | `src/platform/` | Shell infrastructure. May import from `src/shared/`. Must not import from `src/apps/`. |
| Shared | `src/shared/` | FAB domain data. Must not import from `src/apps/` or `src/platform/`. |
| App | `src/apps/<name>/` | Self-contained. May import from platform and shared. Must not import from other apps. |

Routes live in `src/routes/` and import app components via `@fabkit/apps/<name>/*`.

Valid import aliases:
- `@fabkit/platform/*` → `src/platform/`
- `@fabkit/shared/*` → `src/shared/`
- `@fabkit/apps/card-creator/*` → `src/apps/card-creator/`
- `@fabkit/apps/fabble/*` → `src/apps/fabble/`

Relative imports (`./`, `../`) are only valid **within the same layer**. A relative import that crosses a layer boundary is a violation.

## Checks to Run

### BLOCKING — Must fix before commit

**1. Hardcoded user-facing strings**
Any string literal that appears in JSX or as a prop that a user would read (labels, placeholders, warnings, tooltips, button text) MUST use `t()` from `react-i18next`. Flag every instance:
```tsx
// VIOLATION
label="Card Name"
placeholder="Enter a value"

// CORRECT
label={t("name_label")}
```

**2. Wrong i18n namespace**
Each layer owns its own namespace. `useTranslation()` must be called with the correct namespace for where the component lives:
- `src/platform/` components → `useTranslation("platform")`
- `src/apps/card-creator/` components → `useTranslation("card-creator")`
- `src/apps/fabble/` components → `useTranslation("fabble")`

No namespace argument (defaults to `"platform"`) is only acceptable in platform components.

**3. Import boundary violation**
Flag any import that crosses a layer boundary without using the `@fabkit/*` alias:
```ts
// VIOLATION — relative path crossing boundary
import { Button } from "../../platform/components/Button";
import { CardBacks } from "../../../shared/config/cards/card_backs";

// CORRECT
import { Button } from "@fabkit/platform/components/Button";
import { CardBacks } from "@fabkit/shared/config/cards/card_backs";
```

Also flag direction violations:
- Platform importing from `@fabkit/apps/*` — blocking
- Shared importing from `@fabkit/platform/*` or `@fabkit/apps/*` — blocking
- One app importing from another app (`@fabkit/apps/<x>/*` inside `src/apps/<y>/`) — blocking

**4. Raw color or style classes**
No raw Tailwind color utilities or `dark:` variants. Only semantic tokens from `src/styles/index.css`:
```tsx
// VIOLATIONS
className="bg-gray-900 text-white dark:bg-black"

// CORRECT
className="bg-surface text-body"
```
Valid tokens: `bg-surface`, `bg-surface-muted`, `bg-surface-active`, `text-heading`, `text-body`, `text-muted`, `text-subtle`, `text-faint`, `border-border-primary`.

**5. Whole-store Zustand reads**
Never destructure or read the entire store object. Each piece of state must use its own selector:
```tsx
// VIOLATION
const store = useCardCreator();
const { CardName, CardType } = useCardCreator();

// CORRECT
const CardName = useCardCreator((s) => s.CardName);
const CardType = useCardCreator((s) => s.CardType);
```

**6. State set outside the store**
Derived state must be computed inside the store or in the component via selectors/useMemo. Never extract state from the store and set it back with a separate `set`:
```tsx
// VIOLATION — computing derived state outside then setting it
const cards = useCardStore((s) => s.cards);
const filtered = cards.filter(...);
useCardStore.setState({ filtered }); // wrong
```

**7. `<a href>` for internal navigation**
All internal links must use TanStack Router's `<Link>`. Raw anchor tags are only acceptable for external URLs.

**8. TypeScript `any`**
Explicit `any` is a blocking issue. Find a proper type.

---

### WARNINGS — Should fix, not blocking

**Field component pattern drift**
Card field components in `src/apps/card-creator/components/card-creator/fields/` follow a strict pattern. Flag deviations:
- Must call `useIsFieldVisible("FieldName")` and return `null` if not visible
- Must use individual selectors — one `useCardCreator` call per state value
- Must use `useTranslation("card-creator")` for all labels
- Should not contain business logic — read state, render, done

```tsx
// Canonical pattern
export function CardXxxField() {
  const { t } = useTranslation("card-creator");
  const value = useCardCreator((s) => s.CardXxx);
  const setValue = useCardCreator((s) => s.setCardXxx);
  const shouldShow = useIsFieldVisible("CardXxx");
  if (!shouldShow) return null;
  return <TextInput label={t("xxx_label")} value={value || ""} onChange={setValue} />;
}
```

**`useEffect` to sync state**
If a `useEffect` reads one piece of state and writes another, flag it. The logic belongs in the store or as a derived value.

**Component over ~150 lines**
Suggest splitting. Note the specific component and approximate line count.

**Missing prop types**
Components must have explicitly typed props. No implicit `any` via untyped destructuring.

**`useMemo`/`useCallback` without clear reason**
Speculative memoization adds noise. If there's no expensive computation or referential stability requirement, flag it.

**New i18n key not in the right namespace file**
If a new `t("key")` call is added, confirm the key exists in the correct namespace JSON file:
- `src/platform/i18n/en.json` for platform
- `src/apps/card-creator/i18n/en.json` for card-creator
- `src/apps/fabble/i18n/en.json` for fabble

---

## Output Format

Present results clearly. Use this structure:

```
## Review — [file or PR description]

### 🔴 Blocking Issues
[List each one with file:line, what the violation is, and how to fix it]

### 🟡 Warnings
[List each one with file:line and a brief note]

### ✅ Looks Good
[One sentence on what was done well, if anything notable]
```

If there are no blocking issues, say so explicitly. Keep it short — one line per finding. Don't pad.
