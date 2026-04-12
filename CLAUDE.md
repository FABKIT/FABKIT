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

## File Structure

- Routes: `src/routes/` (file-based routing via TanStack Router)
- Components: `src/components/`
- Styles: `src/styles/index.css`
- Translations: `src/assets/i18n/*.json`

## Commands

- `bun dev` - Start dev server
- `bun format` - Lint and format with Biome
