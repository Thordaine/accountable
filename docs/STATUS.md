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

## Run it

Needs Node 24 or later, [uv](https://docs.astral.sh/uv/) and Google Chrome.

- `npm install` once, then `npm run dev` and open http://localhost:5173
- `npm test` runs the backend, frontend and end-to-end tests (46 + 29 + 20)
- `npm run seed` resets the data to the sample data

The data lives in `data/accountable.db` (or the file named by `ACCOUNTABLE_DB`). A new database gets the sample data by itself.

## Known limits

- With many deals, each pipeline column shows its first 40 cards and a "Show N more" button; column totals always cover every deal. Dragging with all 1,000 cards on screen was too slow.
- Tables with more than 150 rows render only the rows near the screen, so the browser's own find (Ctrl+F) doesn't see the rest. The search box covers every row.
- Dates in forms use the browser's date and time pickers, so their format follows the computer's locale.
