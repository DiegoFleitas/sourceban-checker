# sourceban-checker

[![Netlify Status](https://api.netlify.com/api/v1/badges/7b38318d-091d-43bd-b664-b83fd1c738db/deploy-status)](https://app.netlify.com/sites/sourceban-checker/deploys)
[![CI](https://github.com/DiegoFleitas/sourceban-checker/actions/workflows/ci.yml/badge.svg)](https://github.com/DiegoFleitas/sourceban-checker/actions/workflows/ci.yml)

Check whether a **SteamID** appears on any of 80+ [SourceBans++](https://sbpp.github.io/) banlists across TF2 and CS gaming communities, all in one place.

**Live site:** [sourceban-checker.netlify.app](https://sourceban-checker.netlify.app) · **Repository:** [DiegoFleitas/sourceban-checker](https://github.com/DiegoFleitas/sourceban-checker)

## Features

- Checks 80+ SourceBans++ servers in parallel
- Caches results for 7 days per SteamID/server pair
- Accepts Steam3 (`[U:1:…]`), SteamID2, or a Steam profile URL
- Covers servers in North America, South America, Europe, Asia, and Australia
- Supports shareable `?steamid=` URLs
- Includes a per-server Test button to verify XPath selectors are still working

## How it works

1. The app resolves the entered SteamID to the format each server expects.
2. All banlist requests go through a CORS-bypass relay on [Fly.dev](https://fly.dev).
3. Each response gets parsed with `DOMParser` + XPath to detect ban status text.
4. Results are stored in IndexedDB (via `localforage`) and expire after 7 days.
5. The results table sorts by ban status: Banned → Not banned → loading → error.

## Setup

Requires [Bun](https://bun.sh) >= 1.3.11 (`packageManager` is pinned in `package.json`).

```bash
bun install
bun run dev
```

`prepare` runs Husky after install so Git hooks are configured automatically. If hooks are missing, run `bun run prepare`.

## Scripts

| Script | Description |
|---|---|
| `bun run dev` | Start dev server (Vite, port 8080) |
| `bun run build` | Production build → `dist/` |
| `bun run preview` | Preview production build |
| `bun run test` | Run tests in watch mode (Vitest) |
| `bun run test:run` | Run tests once |
| `bun run test:coverage` | Run tests with coverage report |
| `bun run lint` | Lint `src/` with ESLint |
| `bun run lint:fix` | Lint with auto-fix |
| `bun run typecheck` | TypeScript check (vue-tsc) |
| `bun run format` | Format code with Prettier |
| `bun run format:check` | Check formatting only |
| `bun run check` | Full CI gate: format check + lint + typecheck + test |

> [!TIP]
> Run `bun run check` before opening a pull request. It runs the same checks as CI.

A pre-commit hook (`lint-staged`) automatically formats staged `src/**/*.{ts,vue,css,json}` files with Prettier on every commit.

## Project structure

```
src/
├── main.ts               # entry point — Vue app, router, store
├── App.vue               # root component
├── styles.css            # global styles and design tokens
├── utils.ts              # SteamID conversion, caching, fetch logic
├── types/index.ts        # shared TypeScript types
├── components/
│   ├── SearchComponent.vue       # search input and submit
│   └── SearchResultComponent.vue # per-server result row
├── store/
│   └── modules/
│       ├── searches.ts     # ban lookup logic and result state
│       └── testResults.ts  # server scraper validation tests
└── servers.json          # active SourceBans++ server configurations
```

## Adding a server

Each entry in `src/servers.json` describes how to query one SourceBans++ instance:

```jsonc
{
  "domain": "example.tf",
  "url": "https://bans.example.tf/index.php?p=banlist&searchText=",
  "selector": "//table[contains(@class, 'listtable')]",
  "selectorIndex": 0,
  "selectorText": "Permanent",  // optional, defaults to "Permanent"
  "steamIdType": "steam3",      // "steam3" | "steam2_new" | "steam2_old"
  "example": "https://bans.example.tf/index.php?p=banlist&searchText=[U:1:1]",
  "country": "United States",
  "region": "NA",
  "version": "1.7.0-RC8"
}
```

> [!NOTE]
> Use the **Test** button in the UI to verify a new server's XPath selector works before submitting a PR. Offline or broken servers belong in `servers.unavailable.json`.

## Tech stack

| Layer | Technology |
|---|---|
| UI framework | Vue 3 |
| State | Vuex 4 |
| Routing | Vue Router 5 |
| Language | TypeScript (strict) |
| Build | Vite 8 |
| Runtime | Bun 1.3.11+ |
| Testing | Vitest 4 + Istanbul coverage |
| Lint / format | ESLint 10 + Prettier 3 |
| Deployment | Netlify |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). CI runs lint, type checks, tests, and a format check on every PR.
