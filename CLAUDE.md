# BuildOpt - Frontend

BuildOpt is a system for running construction sites in one place. It covers labor management, materials, machinery and equipment, timelines and tasks, inspections, documents, and reports.

**This repo is the frontend only.** The backend is a separate project. There are no API calls yet, so the web app's data is hardcoded in the frontend for now.

## Two parts

- **Website** (`src/pages/website/`): the public marketing site (Home, Features, About, Contact).
- **Web app** (`src/pages/webapp/`): where the site work happens. Users sign in by picking their role first, then entering a username and password. There is no self sign-up in the web app. Accounts and password resets are handled in a separate admin portal.

## Stack

React 19, TypeScript, Vite, React Router 7, Tailwind CSS v4. Icons are inline SVGs; the project doesn't use an icon library.

Commands: `npm run dev`, `npm run build`, `npm run lint`.
