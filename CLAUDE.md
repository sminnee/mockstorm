# Maelstrom Workflow

**Always load the `/mael` skill before beginning any work.** It provides essential instructions for
git operations, commits, branches, PRs, Linear tasks, and development workflows.

**Plan mode is required** for `/plan-task`, `/continue-task`, and `/review-branch` commands.

(maelstrom instructions end)

# Development

## Commit messages

Use conventional commits with these prefixes:

- `feat:` — new behaviour visible to the end user
- `fix:` — bug fix visible to the end user
- `refactor:` — code structure change with no behaviour change
- `chore:` — everything else: docs, config, tooling, tests, CI, etc.

## The agent's main command

Before every commit, run:

```bash
bin/check
```

This runs lint + typecheck + unit tests. All three must pass.

## Commands

| Command | Description |
|---------|-------------|
| `bin/check` | Lint + typecheck + unit tests (run before every commit) |
| `bin/test` | Unit tests only (vitest workspace) |
| `bin/test-e2e` | E2E tests (requires server + web running, or uses Playwright webServer) |
| `bin/lint` | Biome lint check |
| `bin/typecheck` | TypeScript typecheck across all workspaces |
| `bin/setup` | Install deps + Playwright browsers (run once after clone) |
| `bin/dev` | Start all dev services via mael env start |

## Dev services

```bash
mael env start    # start web (5173) + server (3001)
mael env status   # check service status
mael env stop     # stop all services
```

Services are defined in `Procfile`.

## Formatting

```bash
pnpm lint:fix     # auto-fix lint and formatting issues (Biome)
```

## Dead code detection

```bash
pnpm knip         # detect unused exports, files, and dependencies
```

## Project structure

```
web/      React + Vite frontend (port 5173)
server/   Hono API server (port 3001)
e2e/      Playwright E2E tests
bin/      Dev operation scripts
```
