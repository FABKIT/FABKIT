# Platform

Platform is the shell infrastructure layer of FABKIT. It owns:

- Router setup and configuration (`router.tsx`)
- Error boundary context and fallback UI (`error-context.ts`, `components/AppErrorFallback.tsx`)
- Bug report generation and console interception (`bug-report.ts`)
- Shell UI components: navigation menu, footer, layout (`components/layout/`)
- Shared form primitives used across the app (`components/form/`)
- Brand icons (`components/icons/`)
- Platform-wide i18n strings (`i18n/en.json`, namespace `"platform"`)

## Boundary Rule

Platform components MUST NOT import from `src/apps/`. Platform may import from `src/shared/` for domain types and utilities — shared is explicitly below platform in the dependency order. Importing apps from platform breaks the architectural boundary.
