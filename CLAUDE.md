# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start Vite dev server (MSW mocks auto-enabled)
npm run build        # TypeScript check + Vite production build
npm run lint         # ESLint validation
npm run format       # Prettier formatting (src/**/*.{ts,tsx,css,json})
npm run test         # Run tests once (vitest run)
npm run test:watch   # Run tests in watch mode
npm run preview      # Preview production build
```

To run a single test file:
```bash
npx vitest run src/path/to/file.test.ts
```

## Architecture Overview

**DTail** is a workflow/job management UI for Flink/Spark/SQL jobs. It uses React 19, Ant Design 6, React Router 7, and Zustand for state.

### Routing & Auth

- `src/router/index.tsx` — BrowserRouter with protected routes wrapped in `MainLayout` + `AuthGuard`
- `AuthGuard` checks token from `authStore`; redirects to `/login` or `/403` based on auth/permissions
- Routes: `/dashboard`, `/jobs`, `/manage/*` (resources, users, configs, params), `/monitor`

### State Management (Zustand)

All stores are in `src/stores/`:
- **`authStore`** — token + user, persisted to localStorage; login/logout via `api/auth.ts`
- **`jobStore`** — job tree, open tabs, selected node; lazy-loads group children; manages workflow CRUD
- **`langStore`** — active locale (en/zh), persisted
- **`manageStore`** — resources, users, env configs, custom params

### Jobs Module (`src/pages/Jobs/`)

The most complex module — a VS Code-like IDE layout:
- **`index.tsx`** — Two-pane layout: left Sider + right tab area
- **`Sider.tsx`** — Activity bar with 4 panels: Tree, Search, Errors, Trash (240px wide when active)
- **`JobTree.tsx`** — Hierarchical tree of groups/jobs; lazy loads children; context menu actions
- **`DAGEditor.tsx`** — XYFlow-based DAG editor for visualizing/editing workflow graphs
- **`JobTabWrapper/`** — Wraps DAGEditor (workflows) or JobForm (tasks); side drawer for Schedule + Params
- **`tasks/`** — Per-type task forms: `SqlForm`, `ShellForm`, `SparkForm`, `FlinkForm`; `registry.ts` maps types to forms

### API Layer

- `src/api/request.ts` — Axios instance with `baseURL: /api`, 30s timeout; request interceptor adds Bearer token; response interceptor handles 401 (redirect to login), 403, 404, 500
- Separate modules: `api/job.ts`, `api/auth.ts`, `api/dashboard.ts`, `api/manage.ts`, `api/monitor.ts`

### Dev Mocking (MSW)

MSW is automatically started in dev mode (`main.tsx`). Handlers live in `src/mocks/handlers/`. Unhandled requests bypass to the real network (`onUnhandledRequest: "bypass"`).

### i18n

- `src/i18n.ts` — i18next setup; default lang: English
- Translations in `src/locales/en.ts` and `src/locales/zh.ts`
- Active language controlled by `langStore`; Ant Design locale also switches via `App.tsx`

### Path Aliases

`@` maps to `./src` (configured in both `vite.config.ts` and `tsconfig.json`).

### Global Defines

`__APP_NAME__` and `__APP_VERSION__` are injected at build time from `package.json`.

### Testing

- Vitest with jsdom environment; globals enabled
- Setup file: `src/test/setup.ts`
- Test pattern: `src/**/*.{test,spec}.{ts,tsx}`