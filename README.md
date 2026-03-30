# sourceban-checker

[![Netlify Status](https://api.netlify.com/api/v1/badges/7b38318d-091d-43bd-b664-b83fd1c738db/deploy-status)](https://app.netlify.com/sites/sourceban-checker/deploys)

A web tool to quickly look up a Steam account and see if they have SourceBans across a variety of configured servers. Built with Vue 3, TypeScript, and Vite.

## Setup

- **[Bun](https://bun.sh)** >= 1.3.0 (`packageManager` is pinned in `package.json`).
- **Node.js** >= 24.0.0 is optional; see [.nvmrc](.nvmrc) if you use Node-based editor tooling alongside Bun.

```bash
bun install
```

## Scripts

| Script          | Description                          |
|----------------|--------------------------------------|
| `bun run dev`     | Start dev server (Vite, port 8080)   |
| `bun run build`   | Production build (output in `dist/`)|
| `bun run preview` | Preview production build             |
| `bun run test`    | Run tests in watch mode (Vitest)     |
| `bun run test:run`| Run tests once                       |
| `bun run test:coverage` | Run tests with coverage report |
| `bun run lint`    | Run ESLint on `src/`                 |
| `bun run lint:fix`| Run ESLint with auto-fix             |
| `bun run typecheck` | Run TypeScript check (vue-tsc)     |
| `bun run format`  | Format code with Prettier            |
| `bun run format:check` | Check formatting with Prettier  |
| `bun run check`   | Format check + lint + typecheck + test (CI gate) |

Git commits run a pre-commit hook (`lint-staged`) that auto-formats staged
`src/**/*.{ts,vue,css,json}` files with Prettier before commit.

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
