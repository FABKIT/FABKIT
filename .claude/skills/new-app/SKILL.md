---
name: new-app
description: Step-by-step procedure for scaffolding a new FABKIT app in the multi-app platform. Covers directory structure, bug-report provider registration, routing, aliases, nav, and i18n. Invoke with /new-app.
---

You are scaffolding a new FABKIT app. Follow every step in order — skipping one typically causes a runtime or type error that is hard to trace.

## Step-by-Step Checklist

### 1. Create the app directory structure

```
src/apps/<name>/
  components/          # React components
  stores/              # Zustand stores
  i18n/
    en.json            # Namespace translations (start with {})
  index.ts             # Side-effect registrations only — no React
  CLAUDE.md            # App-specific rules and domain vocabulary
```

### 2. Register a bug-report data provider

In `src/apps/<name>/index.ts`:

```typescript
import { registerReportDataProvider } from "@fabkit/platform/bug-report";

registerReportDataProvider("<name>", () => ({
  state: useMyStore.getState(),
  // add: gallery, rendering — only if the app has those concepts
}));
```

Rules:
- First argument is the namespace string — must be unique across apps, matches the i18n namespace
- Second argument is a zero-argument function returning a plain object
- Return `{}` initially if the app has no meaningful state to report — the registration still wires things up correctly
- Do NOT import from `@fabkit/platform/bug-report` anywhere else in the app

### 3. Import `index.ts` as a side-effect in `src/main.tsx`

```typescript
import "./apps/<name>/index"; // side-effect: registers providers
```

Place it after other app imports. Order does not affect correctness, but keep them grouped.

### 4. Create a thin route orchestrator

Create `src/routes/<name>.tsx`:

```typescript
import { createFileRoute } from "@tanstack/react-router";
import { MyAppPage } from "@fabkit/apps/<name>/components/MyAppPage";

export const Route = createFileRoute("/<name>")({
  component: MyAppPage,
});
```

- Route files stay in `src/routes/` — TanStack Router's file-based scanner will not find them elsewhere
- Route files are thin orchestrators: import from the app, render, nothing else
- No business logic in route files

### 5. Add the path alias

In `tsconfig.app.json` only (not `tsconfig.json`, not `vite.config.ts`):

```json
{
  "compilerOptions": {
    "paths": {
      "@fabkit/apps/<name>/*": ["./src/apps/<name>/*"]
    }
  }
}
```

`vite-tsconfig-paths` reads `tsconfig.app.json` and picks up the alias automatically. Do not duplicate it in `vite.config.ts` `resolve.alias`.

> Note: `tsconfig.json` at the root also has a `paths` block — keep it in sync so IDE language servers (VS Code, WebStorm) resolve the alias correctly. The app build uses `tsconfig.app.json`; the IDE uses the root.

### 6. Add a nav link

In `src/platform/components/layout/Menu.tsx`, add a `<Link>` entry for the new app. Follow the same pattern as existing entries.

### 7. Register the i18n namespace

In `src/i18n.ts`:

```typescript
import <name>En from "./apps/<name>/i18n/en.json";

// Add to the resources object:
"<name>": { translation: <name>En },
```

All namespaces must be registered synchronously before any component mounts. Do not lazy-load.

### 8. Write the app's CLAUDE.md

Stub it out with the app's domain vocabulary, component patterns, and any notable gotchas. The root `CLAUDE.md` covers project-wide conventions — the app file should only contain what is specific to this app.

---

## Gotchas

- **`index.ts` must be side-effect only** — no React, no JSX, no hooks. It runs once at startup. Importing React here causes it to initialize before the root render, which can cause subtle ordering bugs.
- **i18n init order** — all namespaces must be registered before any component mounts. Load them synchronously in `src/i18n.ts`; do not lazy-load.
- **Bug-report namespace matches i18n namespace** — the string passed to `registerReportDataProvider` is used as the key in the `.fabreport` file's `apps` object. Use the same string as the i18n namespace for consistency.
- **No cross-app imports** — apps must not import from each other. If two apps share something, it belongs in `src/shared/` (domain data, no UI) or `src/platform/` (UI primitives, no app logic).
- **No `baseUrl` in tsconfig** — `moduleResolution: "bundler"` does not require `baseUrl` for `paths` to work. Do not add it.
