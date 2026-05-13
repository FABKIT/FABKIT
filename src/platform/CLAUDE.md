# Platform

Platform is the shell infrastructure layer of FABKIT. It owns:

- Router setup and configuration (`router.tsx`)
- Error boundary context and fallback UI (`error-context.ts`, `components/AppErrorFallback.tsx`)
- Bug report generation and console interception (`bug-report.ts`)
- Shell UI components: navigation menu, footer, layout (`components/layout/`)
- Shared form primitives used across the app (`components/form/`)
- Brand icons (`components/icons/`)
- Platform-wide i18n strings (`i18n/en.json`, namespace `"platform"`)

## Provider Registry Pattern

`bug-report.ts` collects app-specific state via a provider registry instead of importing directly from app modules:

```typescript
import { registerReportDataProvider } from "@fabkit/platform/bug-report";

registerReportDataProvider(() => ({
  myAppState: useMyStore.getState(),
}));
```

Apps register their providers in their `index.ts` (side-effect import in `main.tsx`). This keeps platform free of app-layer dependencies.

## Boundary Rule

Platform components MUST NOT import from `src/apps/` or `src/shared/`. Platform is a dependency of apps, not the other way around. Violations break the architectural boundary.
