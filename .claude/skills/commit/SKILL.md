---
name: commit
description: Pre-commit pipeline for FABKIT. Runs format, build, reviews changed code, then generates and commits with a conventional commit message. Designed for non-technical contributors — one command does everything. Invoke with /commit or /commit <description>.
model: claude-haiku-4-5-20251001
arguments: [description]
---

You are running the FABKIT pre-commit pipeline. Walk through every step in order. Do not skip steps. If a step fails, stop and explain clearly what went wrong and how to fix it before proceeding.

Your tone should be clear and non-technical — the person running this may not be a developer.

If `$description` was provided, treat it as a hint about intent when generating the commit message — use it to inform the description, but still apply the correct type, scope, and conventional commit format. Do not use it verbatim.

---

## Step 1 — Check for changes

Run `git status` and `git diff HEAD` to understand what has changed.

If there is nothing to commit (clean working tree), tell the user and stop.

Summarise what changed in plain language before proceeding. Example: "You've modified 3 files — two components in the card creator and one translation file."

---

## Step 2 — Format

Run:
```
bun format
```

Biome will automatically fix formatting and lint issues. If it exits with an error (not just warnings), show the relevant output and stop. Tell the user: "The formatter found issues it couldn't fix automatically. Here's what needs attention:" then quote the error.

If it succeeds, say "Formatting looks good." and continue.

---

## Step 3 — Build check

Run:
```
bun run build
```

This runs the Vite build and TypeScript type check. If it fails, stop and show the error output. Explain what it means in plain terms. Do not proceed to review or commit if the build fails.

If the changes are documentation-only (e.g. only `.md` files changed), skip this step and say "No code changes — skipping build check."

If it succeeds, say "Build passed." and continue.

---

## Step 4 — Code review

If the changes are documentation-only (e.g. only `.md` files changed), skip this step and say "No code changes — skipping code review."

Otherwise, run the `/review` skill. It will check the diff against all FABKIT rules and report blocking issues and warnings.

If `/review` reports any blocking issues: do not proceed. Tell the user what to fix, and remind them to re-run `/commit` once resolved.

If there are only warnings or the review is clean: continue to the next step.

---

## Step 5 — Generate commit message

Analyse `git diff HEAD` and determine the right conventional commit message.

**Format:**
```
type(scope): short description

Optional body — only if the change is non-obvious or has important context.
```

**Types:**
| Type | Use when |
|------|----------|
| `feat` | Adding something new (a field, a card type, a page feature) |
| `fix` | Correcting a bug or broken behaviour |
| `refactor` | Restructuring code without changing behaviour |
| `style` | Visual/UI-only changes with no logic change |
| `chore` | Config, dependencies, tooling |
| `i18n` | Translation additions or corrections |
| `build` | Build config, Vite, tsconfig |
| `docs` | README, comments, documentation only |
| `perf` | Performance improvement |

**Scopes for this project:**
| Scope | Use for changes in |
|-------|--------------------|
| `card-creator` | `src/components/card-creator/`, `src/routes/card-creator.tsx` |
| `renderer` | `src/components/card-creator/Renderer/` |
| `fields` | `src/components/card-creator/fields/` |
| `gallery` | `src/components/gallery/`, `src/routes/gallery.tsx` |
| `store` | `src/stores/` |
| `config` | `src/config/` |
| `i18n` | `src/assets/i18n/` |
| `routing` | `src/routes/` (general routing changes) |
| `ui` | `src/components/form/`, `src/components/layout/`, shared components |
| `export` | `src/routes/export.tsx`, `src/export.ts` |
| `docs` | `README.md`, `CONTRIBUTING.md`, or any other documentation files |

Rules for the description:
- Lowercase, no period at the end
- Imperative mood ("add", "fix", "remove" — not "added" or "fixes")
- Max 72 characters for the first line
- Body only if the WHY is not obvious from the description

**Show the proposed commit message to the user and ask for confirmation** before committing. Example:

```
Here's the proposed commit message:

  feat(fields): add CardWeaponHandField with one-hand/two-hand toggle

Does this look right? I'll commit with this message, or let me know if you'd like to change anything.
```

---

## Step 6 — Commit

Once the user confirms (or says "yes", "looks good", "do it", etc.), ask:

> "Do you want to include **all files** (including any new untracked files), or only **files you've already modified**?"
>
> - **All files** — stages everything, including new files you haven't committed before (`git add -A`)
> - **Modified only** — stages changes to files git already knows about, safer if you have temp files or secrets nearby (`git add -u`)

Wait for their choice, then run the appropriate command followed by the commit:

```
# All files
git add -A
git commit -m "<confirmed message>"

# Modified only
git add -u
git commit -m "<confirmed message>"
```

After the commit succeeds, show the commit hash and message in a single short confirmation line. Example:

```
Committed: a3f1c92 — feat(fields): add CardWeaponHandField with one-hand/two-hand toggle
```

---

## If anything goes wrong

Be specific about the error. Don't just say "it failed". Quote the relevant output and explain in plain language what it means. Suggest the most likely fix. Never skip a failing step to get to the commit.
