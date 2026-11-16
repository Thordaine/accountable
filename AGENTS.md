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

## Testing

Run `npm test` before saying a piece of work is done. It runs every suite, one after another, and fails if any test fails:

- backend unit tests: `npm run test:backend` (pytest, `backend/tests/`)
- frontend unit tests: `npm run test:frontend` (Vitest, `frontend/src/**/*.test.ts(x)`)
- end-to-end tests: `npm run test:e2e` (Playwright with Google Chrome, `e2e/`; starts its own backend and frontend on ports 8100 and 5174, using `test-results/e2e.db`)

A failing suite doesn't stop the others, so one run shows every failure.
