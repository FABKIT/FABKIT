# FABKIT

Flesh and Blood TCG toolkit built with React, TanStack Router, and Tailwind CSS v4.

## Code Style

- Use the `/frontend-design` skill when generating UI markup
- All user-facing text must use `t()` from `react-i18next` - no hardcoded strings
- Use semantic color tokens from `src/styles/index.css` (e.g., `bg-surface`, `text-heading`, `text-body`) - avoid `dark:` variants
- Icons come from `lucide-react`; brand icons (Discord, GitHub) are in `src/components/icons/`
- Prefer TanStack Router's `Link` over `<a>` for internal navigation

## Semantic Colors

| Token | Purpose |
|-------|---------|
| `bg-surface` | Page/card backgrounds |
| `bg-surface-muted` | Subtle backgrounds |
| `bg-surface-active` | Active/selected states |
| `text-heading` | Headings (brand color) |
| `text-body` | Body text |
| `text-muted` | Secondary text |
| `text-subtle` | Tertiary text |
| `text-faint` | Very subtle text |
| `border-border-primary` | Primary-tinted borders |

## Platform Architecture

FABKIT is a multi-app platform. New tools/apps live under `src/apps/<app-name>/`.

### Directory Map

| Path | Purpose |
|------|---------|
| `src/routes/` | TanStack Router routes — thin orchestrators only, must stay here |
| `src/platform/` | Shell infrastructure: router, bug-report service, error context |
| `src/shared/` | Cross-app FAB game data (`config/cards/`) and utilities (`lib/`) |
| `src/apps/card-creator/` | Card creator tool — self-contained app |
| `src/apps/fabble/` | Fabble guessing game — self-contained app |
| `src/components/` | Platform shell UI: layout, icons, home, form primitives |
| `src/config/` | Platform config: contact, roadmap, featured artist |
| `src/styles/` | Global design tokens |
| `src/assets/i18n/` | Translations (single `en.json`, feature-namespaced keys) |

### Path Aliases

| Alias | Resolves to |
|-------|------------|
| `@platform/*` | `src/platform/*` |
| `@apps/card-creator/*` | `src/apps/card-creator/*` |
| `@apps/fabble/*` | `src/apps/fabble/*` |
| `@shared/*` | `src/shared/*` |

### App Isolation Rules

- Apps must NOT import from each other (`@apps/card-creator/*` inside `@apps/fabble/*` is forbidden)
- Apps register bug report data via `registerReportDataProvider()` in their `index.ts`
- Each app's `index.ts` is imported in `src/main.tsx` at startup

### Adding a New App

1. Create `src/apps/<name>/` with `components/`, `stores/`, `index.ts`
2. Create `src/routes/<name>.tsx` (thin orchestrator importing from the app)
3. Add alias to `tsconfig.app.json` paths and `vite.config.ts` resolve.alias
4. Import `./apps/<name>/index` in `src/main.tsx`
5. Add nav link in `src/components/layout/Menu.tsx`
6. Add i18n namespace in `src/assets/i18n/en.json`

## Commands

- `bun dev` - Start dev server
- `bun format` - Lint and format with Biome
