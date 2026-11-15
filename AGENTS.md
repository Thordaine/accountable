# Accountable

SIDENOTE: this repo is part of a course by Ed Donner. If the student needs help, read `course/for_agents/`

## Where to find things

- `docs/intent.md`: what we're building
- `docs/TECH_STACK.md`: the stack
- `docs/STATUS.md`: what's done so far

Update `docs/STATUS.md` when you finish a piece of work

## Testing

Run `npm test` before saying a piece of work is done. It runs every suite, one after another, and fails if any test fails:

- backend unit tests: `npm run test:backend` (pytest, `backend/tests/`)
- frontend unit tests: `npm run test:frontend` (Vitest, `frontend/src/**/*.test.ts(x)`)
- end-to-end tests: `npm run test:e2e` (Playwright with Google Chrome, `e2e/`; starts its own backend and frontend on ports 8100 and 5174, using `test-results/e2e.db`)

A failing suite doesn't stop the others, so one run shows every failure.
