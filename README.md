# sourceban-checker

[![Netlify Status](https://api.netlify.com/api/v1/badges/7b38318d-091d-43bd-b664-b83fd1c738db/deploy-status)](https://app.netlify.com/sites/sourceban-checker/deploys)

A web tool to quickly look up a Steam account and see if they have SourceBans across a variety of configured servers. Built with Vue 3, TypeScript, and Vite.

## Setup

- **Node.js** >= 18.12.0 (see [.nvmrc](.nvmrc); recommend Node 20).
- **pnpm** (recommended; `packageManager` is set in `package.json`).

```bash
pnpm install
```

## Scripts

| Script          | Description                          |
|----------------|--------------------------------------|
| `pnpm dev`     | Start dev server (Vite, port 8080)   |
| `pnpm build`   | Production build (output in `dist/`)|
| `pnpm preview` | Preview production build             |
| `pnpm test`    | Run tests in watch mode (Vitest)     |
| `pnpm test:run`| Run tests once                       |
| `pnpm test:coverage` | Run tests with coverage report |
| `pnpm lint`    | Run ESLint on `src/`                 |
| `pnpm lint:fix`| Run ESLint with auto-fix             |
| `pnpm typecheck` | Run TypeScript check (vue-tsc)     |
| `pnpm format`  | Format code with Prettier            |
| `pnpm format:check` | Check formatting with Prettier  |
| `pnpm check`   | Lint + typecheck + test (CI gate)    |

## Project structure

- `src/` – Application source
  - `main.ts` – App entry, router, store
  - `App.vue` – Root component
  - `components/` – Vue components
  - `store/` – Vuex store and modules
  - `types/` – TypeScript types
  - `utils.ts` – Shared utilities (tested in `utils.test.ts`)
  - `servers*.json` – Configured SourceBans server lists
- `public/` – Static assets
- `index.html` – HTML entry

## License

See [LICENSE](LICENSE).
