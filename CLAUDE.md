# FABKIT

Flesh and Blood TCG toolkit built with React, TanStack Router, and Tailwind CSS v4.

## Architecture

Three-layer model — each layer may only import downward:

| Layer | Path | Purpose |
|-------|------|---------|
| **Apps** | `src/apps/<name>/` | Self-contained feature apps (card-creator, fabble) |
| **Platform** | `src/platform/` | Shell infrastructure: router, error boundary, bug report, shared UI primitives |
| **Shared** | `src/shared/` | FAB domain data and generic utilities (no UI, no platform deps) |

Import aliases: `@fabkit/platform/*`, `@fabkit/shared/*`, `@fabkit/apps/card-creator/*`, `@fabkit/apps/fabble/*`

**Boundary rule:** platform must not import from apps; apps must not import from each other. Apps import from platform and shared; platform imports from shared only.

## File Structure

- Routes: `src/routes/` (file-based, flat — TanStack Router requires this)
- Platform components: `src/platform/components/`
- Platform i18n: `src/platform/i18n/`
- Styles: `src/styles/index.css`
- Each app has its own `CLAUDE.md` with app-specific structure and rules
- To add a new app, run `/new-app` — it walks through the full scaffold checklist

## Code Style

- Use the `/frontend-design` skill when generating UI markup
- All user-facing text must use `t()` from `react-i18next` — no hardcoded strings
- i18n namespaces: `"platform"`, `"card-creator"`, `"fabble"` — use the namespace that owns the text
- Icons come from `lucide-react`; brand icons (Discord, GitHub) are in `src/platform/components/icons/`
- Prefer TanStack Router's `Link` over `<a>` for internal navigation
- Use semantic color tokens from `src/styles/index.css` — avoid `dark:` variants

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

## Commands

- `bun dev` - Start dev server
- `bun format` - Lint and format with Biome
- `bun run build` - Production build + type check
- `bun test` - Run tests
