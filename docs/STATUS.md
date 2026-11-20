# Status

## MVP (branch `mvp`)

- [x] Plan: `docs/changes/mvp/intent.md` updated with the answers from the interview
- [x] Design: `docs/spec.md` written; mockup B (`docs/mockups/b-pipeline-river.html`) chosen
- [x] Build: `docs/changes/mvp/plan.md`, all 9 phases built and checked
  - [x] Phase 1: skeleton, commands and app shell
  - [x] Phase 2: records API (organizations, contacts, deals, delete rules)
  - [x] Phase 3: stage rules, timelines, activities, sample data
  - [x] Phase 4: dashboard figures API
  - [x] Phase 5: tables, forms and deleting
  - [x] Phase 6: record pages and timelines
  - [x] Phase 7: pipeline board with drag and drop
  - [x] Phase 8: dashboard
  - [x] Phase 9: end-to-end walkthrough, restart and 1,000-record checks
- [ ] Test
- [ ] Deploy

## Harness (branch `harness`)

- [x] Coding standards: `docs/STANDARDS.md`
- [x] Checks: `npm run check` and `npm run check:quick` (formatting, linting, complexity, types, secrets, tests with 80% unit coverage), `npm run format`
- [x] Hooks: lefthook pre-commit (format, lint, types, secrets); Claude Code hooks that run `npm run check:quick` at the end of each turn and block edits to `.env`
- [x] CI: `.github/workflows/ci.yml` runs gitleaks, then `npm run check:quick`, on every push; it leaves out the end-to-end tests, which run only in `npm run check` on this computer

## Dark mode (branch `dark-mode`)

- [x] Plan: `docs/changes/dark-mode/intent.md`
- [x] Design: `docs/spec.md` (App shell, Look and feel)
- [x] Build: `docs/changes/dark-mode/plan.md`, all 6 phases
  - [x] Phase 1: every color is a token in `frontend/src/styles/tokens.css`
  - [x] Phase 2: light mode meets WCAG 2.2 AA (`contrast.test.ts`)
  - [x] Phase 3: the mode on `<html>`, saved in localStorage, applied before the first paint
  - [x] Phase 4: dark values, also AA
  - [x] Phase 5: the sun/moon toggle beside Add deal
  - [x] Phase 6: end-to-end tests (`e2e/theme.spec.ts`)
- [x] Test: screenshots of the dashboard and pipeline in both modes; seeded times rounded to the minute, so the dashboard end-to-end test no longer fails in the minute after seeding
- [ ] Deploy

## Subagents (branch `subagents`)

- [x] `reviewer` (`.claude/agents/reviewer.md`, Sonnet): reviews against `docs/REVIEW.md`; a hook lets its Bash run only commands that read
- [x] `ui-check` (`.claude/agents/ui-check.md`, Sonnet): checks the running app with the Playwright MCP server against the brand skill and the spec; a hook keeps every file it saves, screenshots included, in `.playwright-mcp/`
- [ ] Try each one (needs a Claude Code restart to load them)

## Sign-in, search and a user menu (branch `multi-user`)

- [x] Plan: `docs/changes/multi-user/intent.md`
- [ ] Design: `docs/spec.md` split into a summary with an index and one area file per area in `docs/specs/`; the change itself not yet designed
- [ ] Build
- [ ] Test
- [ ] Deploy

## Run it

Needs Node 24 or later, [uv](https://docs.astral.sh/uv/), Google Chrome and, for `npm run check`, [gitleaks](https://github.com/gitleaks/gitleaks) 8.25 or later.

- `npm install` once, then `npm run dev` and open http://localhost:5173
- `npm test` runs the backend, frontend and end-to-end tests
- `npm run check` runs every check and the tests; `npm run format` fixes the formatting
- `npm run seed` resets the data to the sample data

The data lives in `data/accountable.db` (or the file named by `ACCOUNTABLE_DB`). A new database gets the sample data by itself.

## Known limits

- With many deals, each pipeline column shows its first 40 cards and a "Show N more" button; column totals always cover every deal. Dragging with all 1,000 cards on screen was too slow.
- Tables with more than 150 rows render only the rows near the screen, so the browser's own find (Ctrl+F) doesn't see the rest. The search box covers every row.
- Dates in forms use the browser's date and time pickers, so their format follows the computer's locale.
