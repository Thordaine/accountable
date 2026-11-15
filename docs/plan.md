# Accountable MVP Implementation Plan

> **For agentic workers:** build one phase at a time, in order. Use superpowers:executing-plans (or superpowers:subagent-driven-development). Steps use checkbox (`- [ ]`) syntax for tracking. Each phase ends with `npm test` passing and a commit: that's the commit point.

**Goal:** Build the Accountable MVP described in `docs/spec.md`: a local, single-user sales CRM with a dashboard, three tables, record pages with timelines, and a drag-and-drop pipeline.

**Architecture:** A FastAPI backend in `backend/` keeps the data in one SQLite file through SQLAlchemy Core and applies the business rules (stage changes, deletes, dashboard figures). A React + Vite frontend in `frontend/` reads it through a JSON API under `/api`, which Vite proxies to the backend in development. Root npm scripts run everything the same way on Mac, Linux and Windows.

**Tech Stack:** Node 26, TypeScript, React 19, Vite 8, React Router 8, TanStack Query 5, TanStack Table 9, Recharts 3, dnd-kit (`@dnd-kit/core` + `@dnd-kit/sortable`), Headless UI 2 (dialog, combobox), sonner (toasts), date-fns 4, Fontsource (fonts); Python 3.12, FastAPI, SQLAlchemy 2 Core, Pydantic 2, uvicorn; Vitest + Testing Library, pytest + FastAPI `TestClient`, Playwright Test with the installed Google Chrome; `concurrently` for `npm run dev`. Versions are current as of 2026-11-15. Use each library's current API: check its docs (the context7 MCP server) before writing code against it, especially TanStack Table 9 and React Router 8, whose APIs changed recently.

**Spec:** `docs/spec.md` (what each screen does), `docs/intent.md` (why), `docs/TECH_STACK.md` (stack and commands), `docs/mockups/b-pipeline-river.html` (the visual reference). Read all four before starting. The brand skill (`.claude/skills/brand/SKILL.md`) applies to all UI work.

## Global constraints

- Commands: `npm run dev` (backend and frontend together), `npm test` (every test, fails if any fails), `npm run seed` (reset to sample data). First-time setup is `npm install`; `uv run` syncs Python by itself.
- Ports: backend 8000, frontend 5173 in development; backend 8100, frontend 5174 for end-to-end tests.
- The database file is `ACCOUNTABLE_DB` if set, else `data/accountable.db` at the repo root (git-ignored by `*.db`); its folder is created if missing. A new database is created and seeded at startup. `ACCOUNTABLE_RESET=1` reseeds at startup (used by end-to-end tests).
- Backend unit tests use a temporary database each; end-to-end tests use `test-results/e2e.db`. Tests never touch `data/`.
- SQLAlchemy Core only: no raw SQL strings, no ORM classes.
- Fully offline: fonts come from Fontsource packages, nothing loads from the internet.
- Light mode only, designed for 1280 px wide and up. Supported browser: Google Chrome.
- Money is whole US dollars, shown as `US$48,200`, or `US$48k` / `US$1.2M` where space is short. Expected revenue is computed unrounded and rounded only when shown.
- "Today" comes from one place in each layer so tests can fix it: the `get_today` FastAPI dependency in the backend, and real `new Date()` in the frontend.
- Dates are local: close and follow-up dates are `YYYY-MM-DD`, "happened at" is a local `YYYY-MM-DDTHH:MM` with no timezone.
- Copy: short labels in sentence case, no exclamation marks, no emojis.
- `README.md` is the course's guide: don't change it. `docs/STATUS.md` says how to run the app and is updated at the end of every phase.
- User rules (`~/.claude/CLAUDE.md`): keep it simple, short modules and functions, concise docstrings, no defensive code, `uv run`/`uv add` only (never `pip` or `python3`).

## Review focus

The inputs the spec implies but doesn't spell out, most likely to bite first. Each has a test in the phase that owns the code.

1. **A deal with no organization and no main contact.** Tables, cards, pages and the dashboard show a dash instead of a name and don't crash; winning it changes no contact. (Phase 2, Phase 5)
2. **Dropping a card back into its own column, or picking the deal's current stage.** No "Moved from Proposal to Proposal" entry, and probability and close date are untouched. (Phase 3)
3. **Boundary dates.** A deal closing today isn't late. A follow-up due today is due, not overdue. One due in exactly 7 days shows, one due in 8 doesn't. (Phase 4)
4. **Empty data.** No deals won or lost in 12 months gives a win rate of "—", never `NaN`; no open deals gives an empty band, never a division by zero; an empty table shows its empty state. (Phase 4, Phase 8)
5. **Unknown addresses and odd search text.** `/deals/9999` shows "Deal not found" with a link back to Deals; searching `(` or `CAFÉ` filters as plain, case-insensitive text. (Phase 5, Phase 6)

## File structure

```
package.json                 root scripts, workspaces: ["frontend"]
playwright.config.ts         e2e config: starts backend 8100 + frontend 5174, Chrome
pyproject.toml, uv.lock      Python project; package `accountable` lives in backend/
backend/accountable/
  main.py                    FastAPI app, lifespan (create tables, seed if new), routers
  db.py                      engine, metadata and the four tables, get_conn, get_today
  schemas.py                 Pydantic models for requests and responses
  rules.py                   stage rules, deal moves, contact timeline query
  organizations.py           router /api/organizations
  contacts.py                router /api/contacts
  deals.py                   router /api/deals
  activities.py              router /api/activities
  dashboard.py               figures + router /api/dashboard
  seed.py                    sample data; `python -m accountable.seed`
backend/tests/               conftest.py (temp DB, fixed today, client) + test_*.py
frontend/
  package.json, vite.config.ts, tsconfig.json, index.html
  src/main.tsx, App.tsx      providers and routes
  src/styles/tokens.css      brand tokens from mockup B
  src/styles/app.css         shell, panels, tables, forms
  src/api/                   types.ts, client.ts (fetch), queries.ts (TanStack Query hooks)
  src/lib/                   format.ts (money, dates), stages.ts (stages, colors, isLate)
  src/components/            NavBar, DataTable, FormDialog, ConfirmDelete, Picker,
                             Timeline, LogActivity, Badge, NotFound
  src/forms/                 OrganizationForm, ContactForm, DealForm, ActivityForm
  src/pages/                 Dashboard, Organizations, Organization, Contacts, Contact,
                             Deals, Deal, Pipeline
  src/dashboard/             PipelineHero, RevenueChart, WinLossChart, Funnel,
                             FollowUps, RecentActivity
  src/**/*.test.ts(x)        Vitest tests next to the code
e2e/*.spec.ts                Playwright tests
```

## Data model

Four tables in `db.py`. Every table has `id` (integer primary key), `created_at` and `updated_at` (local datetime, set by the backend).

| Table | Columns |
|---|---|
| `organizations` | `name` text not null, `website`, `industry`, `notes` text null |
| `contacts` | `name` not null, `email`, `phone`, `job_title` null, `organization_id` FK null, `status` not null (`Lead`, `Qualified`, `Customer`) |
| `deals` | `name` not null, `organization_id` FK null, `contact_id` FK null (main contact), `stage` not null, `value` int ≥ 0, `probability` int 0–100, `close_date` date not null, `position` int not null |
| `activities` | `type` not null (`note`, `call`, `email`, `auto`), `contact_id` FK null, `deal_id` FK null (exactly one set), `description` not null, `happened_at` datetime not null, `follow_up_date` date null, `done` bool not null default false |

Automatic entries are activities with `type = "auto"`. Foreign keys are handled by the delete endpoints, not by cascades, so the rules stay in one readable place.

## API

All JSON. Lists return every record (no paging). Validation errors are FastAPI's 422; a missing record is 404; editing or deleting an automatic entry is 409.

| Method and path | Returns / does |
|---|---|
| `GET /api/health` | `{"status": "ok"}` |
| `GET /api/organizations` | orgs with `contact_count`, `open_deal_value` |
| `GET /api/organizations/{id}` | org with `contacts[]`, `deals[]`, `open_deal_value` |
| `GET /api/contacts` | contacts with `organization_name` |
| `GET /api/contacts/{id}` | contact with `organization_name`, `deals[]` (as main contact), `timeline[]` |
| `GET /api/deals` | deals with `organization_name`, `contact_name`, ordered by stage then `position` |
| `GET /api/deals/{id}` | deal with names and `timeline[]` |
| `POST`, `PUT /api/{organizations,contacts,deals}[/{id}]` | create, replace; returns the record |
| `GET /api/{organizations,contacts,deals}/{id}/impact` | counts for the delete confirmation: org `{contacts, deals}`, contact `{deals, activities}`, deal `{activities}` |
| `DELETE /api/{organizations,contacts,deals}/{id}` | deletes as in the spec's Deleting section; 204 |
| `POST /api/deals/{id}/move` | body `{stage, index}`: stage rules, then place at `index` in that column; returns the deal |
| `POST`, `PUT`, `DELETE /api/activities[/{id}]` | log, edit, delete an activity |
| `PATCH /api/activities/{id}` | body `{done}`: mark a follow-up done or not |
| `GET /api/dashboard` | every dashboard figure (Phase 4) |

Activity responses carry `contact_name` and `deal_name` so a timeline entry can say which deal it's about.

---

## Phase 1: Skeleton, commands and app shell

Everything runs, and every kind of test runs, before there's anything to show.

**Files:** create `package.json`, `pyproject.toml`, `playwright.config.ts`, `backend/accountable/{__init__,main,db}.py`, `backend/tests/{conftest,test_health}.py`, `frontend/*` (Vite React TS), `frontend/src/{App,main}.tsx`, `src/styles/{tokens,app}.css`, `src/components/NavBar.tsx` (+ test), placeholder pages, `e2e/shell.spec.ts`; modify `docs/STATUS.md`.

**Interfaces produced:** `db.get_conn()` (FastAPI dependency yielding a Core `Connection` in a transaction), `db.get_today() -> date`, `db.engine_for(path) -> Engine`; the routes `/`, `/organizations`, `/organizations/:id`, `/contacts`, `/contacts/:id`, `/deals`, `/deals/:id`, `/pipeline`.

- [ ] **Step 1: Python project.** `pyproject.toml` at the root with `name = "accountable"`, `requires-python = ">=3.12"`, the `uv_build` build backend with `module-root = "backend"`, and `[tool.pytest.ini_options] testpaths = ["backend/tests"]`. `uv add fastapi uvicorn sqlalchemy` and `uv add --dev pytest httpx`. Then `uv run python -c "import accountable"` works from any folder.
- [ ] **Step 2: Health test first.** `backend/tests/test_health.py::test_health` asserts `client.get("/api/health").json() == {"status": "ok"}`. `conftest.py` provides `client`: sets `ACCOUNTABLE_DB` to a file in `tmp_path`, builds the app, overrides `get_today` to return `date(2026, 11, 15)`. Run `uv run pytest`, expect it to fail, then add `main.py` with the route and the lifespan that creates tables (no tables yet), and see it pass.
- [ ] **Step 3: Frontend.** Vite React TS app in `frontend/` (workspace). Add `react-router`, `@tanstack/react-query`, `@fontsource-variable/instrument-sans`, `@fontsource-variable/jetbrains-mono`; dev deps `vitest`, `@testing-library/react`, `@testing-library/user-event`, `jsdom`. `vite.config.ts` proxies `/api` to `process.env.ACCOUNTABLE_API ?? "http://127.0.0.1:8000"` and uses `process.env.PORT ?? 5173`.
- [ ] **Step 4: Tokens and shell.** `tokens.css` copies mockup B's `:root` (page `#F0F4F5`, panel `#FFFFFF`, ink `#073B4C`, muted `#5B7C87`, line `#E4EBED`, mist `#CDD8DB`, sea `#06D6A0`, sea-ink `#05936E`, marigold `#FFC145`, coral `#F78C6B`, cerulean `#118AB2`, raspberry `#EF476F`) plus the stage and status colors from the spec. `NavBar` copies mockup B's top bar: the Accountable name, Dashboard, Organizations, Contacts, Deals, Pipeline (active one in Midnight), and an **Add deal** button (does nothing until Phase 5). Test `NavBar.test.tsx`: renders the five links, and the link for the current route has `aria-current="page"`.
- [ ] **Step 5: Root scripts.** `package.json` with `"workspaces": ["frontend"]`, dev deps `concurrently`, `@playwright/test`, and scripts:
  - `dev`: `concurrently -k -n api,web "uv run uvicorn accountable.main:app --port 8000 --reload --reload-dir backend" "npm -w frontend run dev"`
  - `test`: `npm run test:backend && npm run test:frontend && npm run test:e2e`, with `test:backend` = `uv run pytest`, `test:frontend` = `npm -w frontend run test` (`vitest run`), `test:e2e` = `playwright test`
  - `seed`: `uv run python -m accountable.seed` (the module arrives in Phase 3; until then the script exists but isn't run)
- [ ] **Step 6: Playwright.** `playwright.config.ts`: `testDir: "e2e"`, `workers: 1`, `use: { channel: "chrome", baseURL: "http://127.0.0.1:5174" }`, and two `webServer` entries: backend on 8100 with `env: { ACCOUNTABLE_DB: "test-results/e2e.db", ACCOUNTABLE_RESET: "1" }`, frontend on 5174 with `env: { PORT: "5174", ACCOUNTABLE_API: "http://127.0.0.1:8100" }`, `reuseExistingServer: false`. A shared fixture in `e2e/fixtures.ts` fails any test that logs a console error. `e2e/shell.spec.ts`: `/` shows the nav with Dashboard current; clicking Pipeline goes to `/pipeline` and makes it current; reloading `/contacts` stays on Contacts.
- [ ] **Step 7: Verify.** `npm test` passes all three suites. `npm run dev` serves the shell at http://localhost:5173, and the network tab shows no request leaving localhost.
- [ ] **Step 8: STATUS and commit.** `docs/STATUS.md` gains a "Run it" section (`npm install`, `npm run dev`, open http://localhost:5173; `npm test`; `npm run seed`). Commit "Build: phase 1 skeleton".

## Phase 2: Records and their API

Organizations, contacts and deals can be listed, read, created, edited and deleted, with the delete rules. No stage rules yet: Phase 3.

**Files:** modify `db.py` (tables), `main.py`; create `schemas.py`, `organizations.py`, `contacts.py`, `deals.py`, `activities.py` (create/list only for now), tests `test_organizations.py`, `test_contacts.py`, `test_deals.py`.

**Interfaces produced:** the endpoints in the API table except `move`, `PATCH /api/activities/{id}` and `/api/dashboard`; Pydantic models `OrganizationIn/Out`, `ContactIn/Out`, `DealIn/Out`, `ActivityIn/Out`; `STAGES = ["New", "Qualified", "Proposal", "Negotiation", "Won", "Lost"]`, `OPEN_STAGES = STAGES[:4]`, `USUAL_PROBABILITY = {"New": 10, "Qualified": 25, "Proposal": 50, "Negotiation": 75, "Won": 100, "Lost": 0}` in `schemas.py`.

- [ ] **Step 1: Validation tests.** Each fails first, then passes:
  - `test_org_requires_name`: POST `{"name": "  "}` → 422.
  - `test_contact_email_must_look_like_email`: `"ann@"` → 422; `"ann@calder.com"` → 201. New contact without status → `"Lead"`.
  - `test_deal_rules`: value `-1` → 422; probability `101` → 422; no close date → defaults to today + 30 days (`2026-12-15` with the fixed today); no probability → the stage's usual one (`Proposal` → 50).
  - `test_activity_needs_exactly_one_record`: both `contact_id` and `deal_id`, or neither → 422.
- [ ] **Step 2: Implement** the tables, schemas and routers. A new deal gets `position` one less than the lowest in its column, so it goes to the top.
- [ ] **Step 3: List and detail tests.** `test_org_list_counts`: an org with 2 contacts, one open deal of 1,000 and one Won deal of 5,000 lists `contact_count == 2`, `open_deal_value == 1000`. `test_contact_detail` lists the deals where they're main contact. `test_deal_without_org_or_contact`: name-only deal lists with `organization_name is None` and `contact_name is None` (Review focus 1). `test_unknown_id_is_404` for each kind.
- [ ] **Step 4: Delete tests.**
  - `test_delete_org_keeps_links`: impact is `{"contacts": 2, "deals": 1}`; after DELETE both contacts and the deal still exist with `organization_id` `None`.
  - `test_delete_contact`: a contact with 1 deal and 2 activities: impact `{"deals": 1, "activities": 2}`; after DELETE the deal exists with `contact_id` `None`, the 2 activities are gone, and activities logged on the deal are kept.
  - `test_delete_deal`: impact `{"activities": 3}`; after DELETE they're gone.
- [ ] **Step 5: Verify and commit.** `npm test` passes. Update STATUS. Commit "Build: phase 2 records API".

## Phase 3: Stage rules, timelines, activities and sample data

**Files:** create `rules.py`, `seed.py`, tests `test_rules.py`, `test_activities.py`, `test_seed.py`; modify `deals.py`, `activities.py`, `contacts.py`, `main.py`.

**Interfaces produced:** `rules.change_stage(conn, deal_id: int, stage: str, today: date) -> None` (applies the four rules, writes the automatic entries; does nothing if the stage is unchanged); `rules.move_deal(conn, deal_id: int, stage: str, index: int, today: date) -> None` (calls `change_stage`, then renumbers the column's `position`s 0..n with the deal at `index`); `rules.contact_timeline(conn, contact_id) -> list[row]`; `seed.seed(conn, today: date) -> None` (deletes everything and inserts the sample data).

- [ ] **Step 1: Stage rule tests** (`test_rules.py`), each failing first:
  - `test_move_sets_usual_probability`: a Proposal deal with hand-set probability 60 moved to Negotiation has 75.
  - `test_move_writes_entry`: its timeline's newest entry is `type "auto"`, `"Moved from Proposal to Negotiation"`.
  - `test_won_sets_close_date_and_customer`: moved to Won → `close_date == "2026-11-15"`, probability 100, its Lead main contact is now `Customer`, and the contact's timeline has the automatic entry `"Status changed from Lead to Customer"`.
  - `test_won_customer_unchanged`: a main contact already `Customer` gets no new entry.
  - `test_won_without_contact`: a deal with no main contact moves to Won without error (Review focus 1).
  - `test_reopen`: a Won deal moved to Qualified has probability 25 and the entry "Moved from Won to Qualified"; its close date is unchanged.
  - `test_same_stage_is_not_a_change`: moving a Proposal deal to Proposal at another index keeps its probability and close date and adds no entry (Review focus 2).
  - `test_hand_probability_kept`: PUT with the same stage and probability 60 keeps 60.
  - `test_won_close_date_editable`: after a move to Won, PUT with the same stage and close date 2026-11-10 keeps 2026-11-10.
  - `test_put_changing_stage_applies_rules`: PUT with a new stage behaves like a move to the top of that column.
  - `test_move_positions`: three deals in New at indexes 0, 1, 2; move the third to index 0 → order is third, first, second, and stays so on the next GET.
- [ ] **Step 2: Implement** `rules.py`, the `move` route, and the stage-change branch of PUT.
- [ ] **Step 3: Activity and timeline tests** (`test_activities.py`):
  - `test_contact_timeline_includes_main_contact_deals`: one activity on the contact and one on their deal → the contact's timeline has both, newest first by `happened_at`; the deal one carries `deal_name`.
  - `test_auto_entries_locked`: PUT or DELETE on an automatic entry → 409.
  - `test_mark_done`: PATCH `{"done": true}` → `done` is true; on an activity without a follow-up date → 422.
- [ ] **Step 4: Sample data tests** (`test_seed.py`, with today fixed at 2026-11-15) after `seed(conn, today)`:
  - 15 organizations, 40 contacts, 50 deals, 80 activities logged by hand (notes, calls, emails), plus the automatic entries from the sample history. Exact numbers keep the test simple.
  - Contacts at all three statuses; organizations in at least 5 industries.
  - 16 open deals, 4 in each open stage; 25 Won, 9 Lost; every Won and Lost close date within the current month and the 11 before it; each of those 12 months has 0 to 4 Won deals.
  - 3 or 4 open deals with a close date before today; the other open deals close within the next 6 months.
  - At least 3 follow-ups not done and overdue, and at least 3 due in the next 7 days.
  - Running `seed` twice gives the same counts (it replaces, never adds).
- [ ] **Step 5: Implement** `seed.py`: hand-written realistic names, companies (the mockup's Halden Freight, Fernhill Clinics, Calder Foods, Osprey Materials, Bellweather Credit Union and Tidewater Hotels among them), and descriptions; dates as offsets from `today`; a fixed `random.Random(7)` where variety is needed, so it's the same every time. Stage changes in the sample history include automatic entries. `python -m accountable.seed` seeds the configured database with `date.today()` and prints the counts. The lifespan seeds when the database is new or `ACCOUNTABLE_RESET=1`.
- [ ] **Step 6: Verify and commit.** `npm test` passes; `npm run seed` prints the counts. Update STATUS. Commit "Build: phase 3 rules and sample data".

## Phase 4: Dashboard figures

**Files:** create `dashboard.py`, `test_dashboard.py`; modify `main.py`.

**Interfaces produced:** `dashboard.figures(conn, today: date) -> Dashboard` and `GET /api/dashboard` returning:

```
months: ["2025-12", ..., "2026-11"]                     # current month and the 11 before
revenue_won: [int x12], won: [int x12], lost: [int x12] # by close date
win_rate: int | None                                    # round(100 * won / (won + lost)), None if both 0
open: {value, expected, count, late, stages: [{stage, count, value, expected} x4]}
funnel: [{stage, value} for New..Won]                   # value of non-Lost deals at that stage or later
follow_ups: [{activity_id, description, follow_up_date, overdue, record: {kind, id, name}}]
recent: [activity with record link] x10                 # newest by happened_at, then id
```

- [ ] **Step 1: Tests**, each on a small hand-made dataset (not the sample data) so the figures are easy to check:
  - `test_months_and_revenue`: Won 1,000 closed 2026-11-02 and 2,000 closed 2025-12-31, plus 4,000 closed 2025-11-30 → `revenue_won[11] == 1000`, `revenue_won[0] == 2000`, and the 2025-11 one counts nowhere.
  - `test_win_rate`: 3 won, 1 lost → 75; none → `None` (Review focus 4).
  - `test_open_figures`: New 10,000 (10%) and Negotiation 20,000 (75%) → `value 30000`, `expected 16000`, `count 2`.
  - `test_late`: an open deal closing yesterday counts as late; one closing today doesn't (Review focus 3).
  - `test_funnel`: New 100, Proposal 200, Won 300, Lost 400 → New 600, Qualified 500, Proposal 500, Negotiation 300, Won 300.
  - `test_follow_ups_window`: due yesterday (overdue), today (not overdue), today + 7 (shown), today + 8 (not shown), done (not shown); order overdue first, then soonest (Review focus 3).
  - `test_recent_limit`: 12 activities → 10, newest first, automatic entries included.
  - `test_thousand_records`: with 1,000 organizations, contacts, deals and activities, each list endpoint and `/api/dashboard` answers in under 0.5 seconds.
- [ ] **Step 2: Implement** with Core `select` and Python sums: fine for 1,000 records.
- [ ] **Step 3: Verify and commit.** `npm test` passes; against the sample data, `GET /api/dashboard` shows 16 open deals and 25 won. Commit "Build: phase 4 dashboard API".

## Phase 5: Tables, forms and deleting

The Organizations, Contacts and Deals sections work end to end.

**Files:** create `src/api/{types,client,queries}.ts`, `src/lib/{format,stages}.ts` (+ tests), `src/components/{DataTable,FormDialog,ConfirmDelete,Picker,Badge}.tsx` (+ `DataTable.test.tsx`), `src/forms/{Organization,Contact,Deal}Form.tsx` (+ `DealForm.test.tsx`), `src/pages/{Organizations,Contacts,Deals}.tsx`, `e2e/tables.spec.ts`; modify `NavBar.tsx` (Add deal opens the deal form), `App.tsx` (add `<Toaster />`).

**Interfaces produced:** `formatMoney(n) -> "US$48,200"`, `formatMoneyShort(n) -> "US$48k" | "US$1.2M"`, `formatDate("2026-11-15") -> "15 Nov 2026"`, `formatDue(date, today) -> "4 days overdue" | "1 day overdue" | "Today" | "Tue 17 Nov"` (the mockup's follow-up wording); `STAGES`, `STAGE_COLOR`, `STATUS_COLOR`, `USUAL_PROBABILITY`, `isLate(deal, today)`; query hooks `useOrganizations()`, `useContacts()`, `useDeals()`, `useDashboard()`, `useRecord(kind, id)` and mutations that invalidate the affected queries; `<DataTable columns rows defaultSort searchPlaceholder noun />`; `<DealForm initial? onDone />` (also used by Pipeline and record pages).

- [ ] **Step 1: Format and stage tests** (`format.test.ts`, `stages.test.ts`): `formatMoney(48200) === "US$48,200"`, `formatMoney(0) === "US$0"`, `formatMoneyShort(48200) === "US$48k"`, `formatMoneyShort(1175050) === "US$1.2M"`, `formatMoneyShort(950) === "US$950"`; `formatDue` gives "2 days overdue", "Today" and "Tue 17 Nov" for 13, 15 and 17 November with today 15 November 2026; `isLate` true for an open deal closing yesterday, false for today, false for a Won deal closing last year.
- [ ] **Step 2: DataTable** on TanStack Table 9: a search box filtering as you type with a case-insensitive, plain-text match on every column's shown text; clickable headings (ascending, then descending, an arrow on the sorted one); the count line "18 of 40 contacts"; an empty state with **Clear search**. `DataTable.test.tsx`: typing `CAFÉ` matches "Café Linde"; typing `(` doesn't throw and shows the empty state (Review focus 5); clicking Name twice reverses the order; the count line updates.
- [ ] **Step 3: Forms.** `FormDialog` on Headless UI `Dialog` (Save, Cancel, Escape cancels). Required fields marked; Save checks them on the client and shows "Required" next to each empty one instead of saving; 422 messages from the server show next to their fields. `Picker` on Headless UI `Combobox` for organization and contact. On save: close, invalidate, toast "Organization saved" / "Contact saved" / "Deal saved". `DealForm.test.tsx`: changing the stage to Negotiation sets probability to 75; a new deal's close date is today + 30 days; Save with no name shows "Required".
- [ ] **Step 4: Tables.** Columns and default sorts exactly as the spec's table. The Contacts status filter (All, Lead, Qualified, Customer) as a segmented control. Stage and status as colored badges. A late deal's close date in Raspberry with a "Late" badge. Names link to `/organizations/:id` etc. Edit and Delete on each row; Delete fetches `/impact` and shows the spec's wording, e.g. "Delete Calder Foods? Its 4 contacts and 3 deals will be kept, with no organization." A missing organization or contact shows "—" (Review focus 1).
- [ ] **Step 5: End-to-end** (`e2e/tables.spec.ts`): add a contact "Priya Raman" as a Lead at Calder Foods → it's in the table, still there after reload; search `raman` → "1 of 41 contacts"; sort by Name descending; edit her job title; filter by Lead shows her; delete her → the confirmation says how many deals and activities, and she's gone after reload. Add a deal with only a name from the nav's Add deal → it shows in Deals with "—" for organization and contact.
- [ ] **Step 6: Verify and commit.** `npm test` passes. In `npm run dev`, check the three tables by eye against mockup B's panels and type. Update STATUS. Commit "Build: phase 5 tables and forms".

## Phase 6: Record pages and timelines

**Files:** create `src/pages/{Organization,Contact,Deal}.tsx`, `src/components/{Timeline,LogActivity,NotFound}.tsx` (+ `Timeline.test.tsx`), `src/forms/ActivityForm.tsx`, `e2e/records.spec.ts`.

**Interfaces produced:** `<Timeline entries showDealName />`, `<LogActivity contactId? dealId? />`, mutation hooks `useLogActivity`, `useUpdateActivity`, `useDeleteActivity`, `useSetDone`, `useMoveDeal` (POST move; used again in Phase 7).

- [ ] **Step 1: Timeline test** (`Timeline.test.tsx`): a note, a call and an automatic entry render with their type icons, newest first; the automatic one has no Edit or Delete; a follow-up dated yesterday and not done shows in Raspberry with an unchecked box; on a contact's timeline a deal activity shows "On deal: Calder Foods renewal".
- [ ] **Step 2: Pages** per the spec's Organization, Contact and Deal page sections, as white panels in mockup B's style. The deal page shows expected revenue, says "Late" when it is, and has a stage selector that calls `useMoveDeal(id, stage, 0)` and then refreshes the page's data. Each page has Edit (the Phase 5 form) and Delete (back to the section's table afterwards). An unknown id shows `NotFound`: "Deal not found" and a link to Deals (Review focus 5). The organization page's Add contact and Add deal open the forms with the organization filled in.
- [ ] **Step 3: Log form** at the top of each timeline: type (Note, Call, Email), description, happened at (defaults to now), optional follow-up date. Logging adds the entry at the top and toasts "Activity logged". Entries can be edited and deleted (with confirmation); the checkbox marks a follow-up done.
- [ ] **Step 4: End-to-end** (`e2e/records.spec.ts`): open a deal from the Deals table; log a call with a follow-up tomorrow → it's first on the timeline; open the main contact → the call is there too, with the deal's name; move the deal to Won with the stage selector → the timeline shows "Moved from … to Won", the close date is today, the contact's status is Customer with its own entry; tick the follow-up done → still ticked after reload. Visiting `/deals/9999` shows "Deal not found".
- [ ] **Step 5: Verify and commit.** `npm test` passes; check each page by eye. Update STATUS. Commit "Build: phase 6 record pages".

## Phase 7: Pipeline

**Files:** create `src/pages/Pipeline.tsx`, `src/pipeline/{Board,Column,DealCard,boardMath}.ts(x)` (+ `boardMath.test.ts`), `e2e/pipeline.spec.ts`.

**Interfaces produced:** `columnsFrom(deals) -> Record<Stage, Deal[]>`, `moveCard(columns, dealId, toStage, toIndex) -> columns` (pure; applies the new stage's usual probability, and today's date for Won or Lost, only when the stage changes), `totals(deals) -> {value, expected}`.

- [ ] **Step 1: Board math tests** (`boardMath.test.ts`): `moveCard` from Proposal to Negotiation at index 1 puts the card second in Negotiation with probability 75 and takes it out of Proposal; within Proposal from index 2 to 0 reorders and keeps a hand-set probability of 60; `totals` of New 10,000 and Negotiation 20,000 is `{value: 30000, expected: 16000}` and leaves out Won and Lost.
- [ ] **Step 2: Board.** Six columns in stage order with `@dnd-kit/core` + `@dnd-kit/sortable` (one `SortableContext` per column, `DragOverlay` for the moving card, pointer and keyboard sensors). Cards: name, organization (or nothing), value, close date; a late card has a Raspberry edge tint and a "Late" badge (not a one-sided border, per the brand). Click opens the deal. Column header: stage name with its color, count, total value, expected revenue. Above the board: open deals' total value and expected revenue. Each column has **Add**, which opens `DealForm` with that stage.
- [ ] **Step 3: Optimistic moves.** On drop, `useMoveDeal` runs `moveCard` on the cached deals list in `onMutate` (so every figure updates at once), POSTs `{stage, index}`, rolls back and toasts "Couldn't move the deal" on error, and invalidates deals and dashboard on settle.
- [ ] **Step 4: End-to-end** (`e2e/pipeline.spec.ts`): drag a New card into Qualified's second place → the column counts and totals change before the request finishes (check with the request delayed via `page.route`); after reload it's still second in Qualified; the Deals table shows Qualified and 25%. Drag a card from third to first in its own column → still first after reload. Add a deal from the Proposal column → it's at the top of Proposal. Late cards show "Late".
- [ ] **Step 5: Verify and commit.** `npm test` passes; drag cards around in Chrome by eye. Update STATUS. Commit "Build: phase 7 pipeline".

## Phase 8: Dashboard

**Files:** create `src/pages/Dashboard.tsx`, `src/dashboard/{PipelineHero,RevenueChart,WinLossChart,Funnel,FollowUps,RecentActivity}.tsx` (+ `PipelineHero.test.tsx`), `e2e/dashboard.spec.ts`.

- [ ] **Step 1: Hero test** (`PipelineHero.test.tsx`): with the mockup's figures (stages New 4/63,500, Qualified 4/115,500, Proposal 4/125,500, Negotiation 4/197,750; 3 late; win rate 74) it shows "US$502,250", "US$246,288", "16" with "Open deals, 3 late", and "74%" with "Win rate, last 12 months" (the mockup's wording), and four segments whose widths are proportional to value; with no open deals it shows "No open deals" and no segments; with `win_rate: null` it shows "—" (Review focus 4).
- [ ] **Step 2: Build the dashboard** to match `docs/mockups/b-pipeline-river.html` row by row, reusing its structure and CSS where it fits: the hero (large total, the three figures beside it, the stage band with expected revenue shaded inside each segment, each segment linking to `/pipeline`); Revenue won as a Recharts `LineChart` and Deals won and lost as a grouped `BarChart`, with totals in their headers and month labels like the mockup; the stepped funnel; Follow-ups with checkboxes (`useSetDone`, then refetch) and record links, overdue dates in Raspberry; Recent activity (10) with links. Charts use the brand colors (sea-ink line, Midnight won bars, Raspberry lost bars) and JetBrains Mono for figures.
- [ ] **Step 3: End-to-end** (`e2e/dashboard.spec.ts`): the dashboard's open total equals the sum of open deal values from `GET /api/deals`; both charts and the band render; logging a follow-up due tomorrow on a contact makes it appear in Follow-ups; ticking it removes it after reload; winning a deal on its page and returning raises "Revenue won"'s total by its value and puts "Moved from … to Won" first in Recent activity.
- [ ] **Step 4: Verify and commit.** `npm test` passes. With `npm run seed` and `npm run dev`, put the dashboard and `docs/mockups/b-pipeline-river.png` side by side at 1440 px and fix any difference that isn't explained by the data. Update STATUS. Commit "Build: phase 8 dashboard".

## Phase 9: End-to-end walkthrough

The build is done when the intent's success criteria hold, not only the tests.

- [ ] **Step 1: Full journey test** (`e2e/journey.spec.ts`), one long test as a salesperson's day: land on the dashboard, add an organization, a contact at it and a deal for them, move the deal across the pipeline to Won, log a call with a follow-up on the deal, see it on the dashboard, mark it done, delete the organization (contact and deal kept, unlinked), and check the console stayed clean throughout.
- [ ] **Step 2: Restart and size check.** Stop and restart `npm run dev`: every change is still there. `npm run seed` brings the sample data back. Load 1,000 records of each kind into a scratch database (`ACCOUNTABLE_DB`) and check that the tables search and sort without a noticeable delay and the pipeline still drags smoothly.
- [ ] **Step 3: Walk every screen in Chrome** with the Playwright MCP at 1280 and 1440 px against mockup B: frame, panels, type, colors, money formats, empty states, the "Late" badges. Fix what's off. No console errors on any screen.
- [ ] **Step 4: STATUS and commit.** `docs/STATUS.md`: Build checked, how to run and test, anything known to be missing. Commit "Build: phase 9 walkthrough". The Test stage follows.
