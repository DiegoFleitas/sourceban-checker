# Contributing

Thanks for your interest in contributing to sourceban-checker.

## Development setup

1. Fork and clone the repo.
2. Install dependencies: `bun install`
3. Run the app: `bun run dev`

## Before submitting

Run the full check (lint, typecheck, tests):

```bash
bun run check
```

Optionally run formatting and fix lint issues:

```bash
bun run format
bun run lint:fix
```

## Code style

- TypeScript strict mode; use the existing types in `src/types/`.
- Vue: follow ESLint `plugin:vue/recommended` and the project’s Vue style.
- Format with Prettier (config in `.prettierrc`); use `bun run format` before committing.

## Pull requests

- Keep changes focused and described clearly in the PR.
- Ensure CI passes (lint, typecheck, test, format check).
