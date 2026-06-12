# BuildOpt — Frontend

Web frontend for **BuildOpt**, a construction-site management system for tracking
**laborers, materials, machines and equipment** across sites.

## Tech stack

- **React 19** + **TypeScript** (`.tsx`)
- **Vite 8** — dev server & build
- **React Router 7** — routing
- Plain CSS with design tokens (CSS variables) — no UI framework yet

## Getting started

```bash
npm install      # install dependencies
npm run dev      # start the dev server at http://localhost:5173
npm run build    # type-check + production build into dist/
npm run preview  # preview the production build
npm run lint     # run ESLint
```

## Project structure

```
src/
  components/   Reusable UI: PageHeader, StatCard, DataTable, Badge
  layout/       AppLayout — sidebar + topbar shell
  pages/        Dashboard, Laborers, Materials, Machines, Equipment
  data/         mockData.ts — sample data (to be replaced by the API)
  types/        Domain models (Laborer, Material, Machine, Equipment)
  App.tsx       Route definitions
  main.tsx      App entry / router provider
```

## Status

Early scaffold. Pages render against **mock data** for now — the next step is
wiring them up to the backend API.
