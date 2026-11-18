# Accountable

SIDENOTE: this repo is part of a course by Ed Donner. If the student needs help, read `course/for_agents/`

## Where to find things

- `docs/spec.md`: what the product does today. Read it first
- `docs/TECH_STACK.md`: the stack
- `docs/STANDARDS.md`: the coding standards every change follows
- `docs/STATUS.md`: what's done so far
- `docs/REVIEW.md`: how changes are reviewed

## Changes

Each change has its own folder, `docs/changes/<branch name>/`, with its `intent.md` (why and what) and `plan.md` (how). The MVP's is `docs/changes/mvp/`.

Read only the current change's folder, the one named after the branch you're on. The other folders are a record of past changes; `docs/spec.md` already describes what they built.

Update `docs/STATUS.md` when you finish a piece of work, and `docs/spec.md` when a change alters what the product does.

When the build departs from `plan.md`, for example with a fix outside it, a different file layout or a value it didn't agree, record the departure in `plan.md` and, if it changes what the product does, in `docs/spec.md`, before saying the work is done. Saying it in chat isn't enough, because the reviewer only reads the docs and the code.

At Deploy, after the review fixes and before the merge, follow `docs/IMPROVE.md`.

## Checks

Run `npm run check` before saying a piece of work is done. It runs every check below, one after another, and fails if any fails:

- formatting: Prettier for `frontend/`, ruff format for `backend/`. `npm run format` fixes it
- linting: ESLint with the recommended TypeScript, React Hooks and accessibility rules, and ruff check. No function may exceed a cyclomatic complexity of 15
- types: tsc for `frontend/`, ty for `backend/`
- secrets: gitleaks (8.25 or later) over the git history and the working tree. Only the git-ignored `.env` may hold secrets
- tests: `npm test`, which fails if either unit test suite covers less than 80% of its lines:
  - backend unit tests: `npm run test:backend` (pytest, `backend/tests/`)
  - frontend unit tests: `npm run test:frontend` (Vitest, `frontend/src/**/*.test.ts(x)`)
  - end-to-end tests: `npm run test:e2e` (Playwright with Google Chrome, `e2e/`; starts its own backend and frontend on ports 8100 and 5174, using `test-results/e2e.db`)

A failing check doesn't stop the others, so one run shows every failure. `npm run check:quick` runs the same checks without the end-to-end tests.

Fix what a check finds; never weaken or switch off a rule to get past it. If a rule doesn't suit this project, ask first.

## Hooks

- Git pre-commit (lefthook, `lefthook.yml`, installed by `npm install`): formats the staged files and stages the result, then runs ESLint and ruff check on the staged files, tsc and ty, and gitleaks on the staged changes. It skips the tests, so it stays quick
- Claude Code (`.claude/settings.json`, scripts in `.claude/hooks/`):
  - when Claude finishes a turn, `npm run check:quick` runs; a failure is sent back to Claude to fix, once per turn (the full output is in `logs/check-quick.log`)
  - Claude may not edit `.env`, through its file tools or through a shell command that names it
  - the reviewer subagent may run only shell commands that read (`.claude/hooks/reviewer-read-only.sh`)
  - the ui-check subagent may save files only in `.playwright-mcp/`, and every screenshot must name its file (`.claude/hooks/ui-check-output-dir.sh`)

## Subagents

In `.claude/agents/`, both on Sonnet:

- `reviewer`: reviews a branch or a commit against `docs/REVIEW.md` and reports findings by severity. It changes nothing
- `ui-check`: checks the running app (`npm run dev`) with the Playwright MCP server against the brand skill and `docs/spec.md`, in light and dark mode. Its screenshots go in `.playwright-mcp/`, which git ignores. It changes no code or data
