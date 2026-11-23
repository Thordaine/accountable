# Sign-in, search and a user menu: plan

**Goal:** a team shares one Accountable on Render, signed in with Supabase Auth, its data in Postgres on Supabase; every record shows who added it; a search box in the top bar; a menu under your initials with the theme and Sign out. `docs/spec.md` and its area files already describe the result (`sign-in.md`, `search.md`, `running.md`, `data.md`, `app-shell.md`, `records.md`, `activities.md`).

**Read first:** `docs/changes/multi-user/intent.md`, `docs/spec.md`, then the area files above.

**How, in short**

- **One switch: `DATABASE_URL`.** Set, the backend uses Postgres and checks Supabase tokens (the shared app). Unset or empty, it uses the local SQLite file and the test sign-in (`npm run dev`, `npm run seed`, every test). Nothing reads `.env` except `npm start`, through `uv run --env-file .env`, and Render sets the variables itself. So `npm run dev` and the tests can't touch Supabase even when `.env` holds the settings.
- **Tokens.** Supabase signs access tokens with the project's asymmetric key. The backend checks each one against the project's public keys (JWKS, fetched once and cached), with audience `authenticated`, and takes the user from its claims: `email`, and `user_metadata.display_name` as the name, else the email. The test sign-in instead gives a fixed opaque token for Test User, accepted only when `DATABASE_URL` is unset. No secret is needed anywhere: the JWKS are public, and the browser gets only the publishable key.
- **The browser** asks `GET /api/config` which sign-in to use, so the built app needs no settings baked in. Supabase sign-in goes through `supabase-js`, which keeps and refreshes the session. Every API call sends `Authorization: Bearer <token>`; a 401 signs out, which shows the sign-in screen over the same address.
- **Migrations** with Alembic run when the app starts, on SQLite and Postgres alike. The sample data goes in only when the migrations created the database, so Supabase gets it once and is never reset.
- **Who added it** is stored as names, `created_by` and `updated_by`, beside `created_at` and `updated_at`, so a record keeps the name its person had when they saved it.
- **Time zones follow the browser.** Render runs in UTC and the team may not share one zone, so the browser decides. Every API call sends `X-Time-Zone` (the browser's IANA zone, from `Intl`), and the backend's "today" is today in that zone: late deals, follow-ups due, the close date of a deal won today, new deals' default close date. Times (`created_at`, `updated_at`, `happened_at`) are stored in UTC on both databases and sent as ISO strings ending in `Z`, and the browser shows them in its own zone. The activity form sends `happened_at` with its offset.
- **Search** is one route, `GET /api/search?q=`, using SQLAlchemy's `icontains(..., autoescape=True)`. SQLite's own `lower()` folds only ASCII, so the SQLite engine registers Python's `str.lower` as `lower`, and both databases fold case the same way.
- **The menu and search box** use Headless UI's `Menu` and `Combobox`, already a dependency, for the keyboard and click-outside behaviour.

**New dependencies, and why**

| Dependency | Why |
|---|---|
| `psycopg[binary]` (backend) | SQLAlchemy needs a Postgres driver. psycopg 3 is the current one, and the binary wheel needs no compiler on Render |
| `alembic` (backend) | The intent asks for migrations on start. It's SQLAlchemy's own migration tool and handles both databases |
| `pyjwt[crypto]` (backend) | Checks Supabase's signed tokens on every request without a network call per request; `PyJWKClient` fetches and caches the public keys |
| `tzdata` (backend) | Python's `zoneinfo` reads the system's time zone database, which Windows doesn't have, and local runs must work on Windows. It's the IANA data, published by Python's core team |
| `@supabase/supabase-js` (frontend) | Supabase's own client: password sign-in, keeping the session in the browser and refreshing the token. Hand-rolling token refresh is what the stack says not to do |

## Files that change

Each part below could be built by its own agent: no file appears in two parts. The parts agree on these interfaces, so they can be built side by side:

- **Backend user:** `accountable.auth.CurrentUser`, a FastAPI dependency giving `User(name: str, email: str)`. Signed out it raises 401.
- **Backend writes:** `insert_row(conn, table, values, by: str)` sets `created_by` and `updated_by` to `by`; updates set `updated_by=by` themselves. The seed passes `by="Sample data"`.
- **Backend database:** `accountable.db.make_engine(settings)` and `accountable.migrate.upgrade(engine) -> bool`, true when it created the database.
- **API:** `GET /api/config` gives `{"mode": "local"}` or `{"mode": "supabase", "supabase_url": ..., "supabase_publishable_key": ...}`; `POST /api/local-sign-in` (local mode only) takes `{email, password}` and gives `{token}` or 401; `GET /api/me` gives `{name, email}`; `GET /api/search?q=` gives `{organizations: [{id, name}], contacts: [{id, name, organization_name}], deals: [{id, name, organization_name}]}`. Every record and activity gains `created_by` and `updated_by`. Every call carries `X-Time-Zone`; times go both ways as ISO strings with a zone (`Z` from the server).
- **Backend time:** `accountable.db.UtcDateTime`, the column type for every time, which stores UTC and gives back aware datetimes; `Today` is today in the request's `X-Time-Zone`.
- **Frontend:** `useAuth()` from `frontend/src/auth/AuthProvider.tsx` gives `{ user: {name, email}, signOut }`. `Stamped` in `api/types.ts` gains `created_by` and `updated_by`. Each new component imports its own stylesheet, so only the top bar part edits `app.css`.

### 1. Commands, dependencies and deploy

- `package.json`: `start` (builds the frontend, then `uv run --env-file .env uvicorn accountable.main:app --port 8000`); `dev` unchanged.
- `pyproject.toml`, `uv.lock`: `psycopg[binary]`, `alembic`, `pyjwt[crypto]`, `tzdata` (through `uv add`); Alembic's settings under `[tool.alembic]`.
- `frontend/package.json`, `package-lock.json`: `@supabase/supabase-js`.
- `render.yaml` (new): one Python web service on the free plan; build installs with `npm ci` and `uv sync --frozen --no-dev` and builds the frontend; start runs uvicorn on `$PORT`; `DATABASE_URL`, `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` with `sync: false`, so their values are entered in Render; health check `/api/health`.

### 2. Backend database

- `backend/accountable/db.py`: `created_by` and `updated_by` on all four tables; `make_engine(settings)` for SQLite or Postgres (rewrites `postgresql://` to `postgresql+psycopg://`, `pool_pre_ping` for connections Supabase drops while Render sleeps); the SQLite engine registers a Unicode `lower`; `insert_row` takes `by`; `UtcDateTime` for `created_at`, `updated_at` and `happened_at`, with the stamps' defaults in UTC; `get_today` reads `X-Time-Zone` (an unknown zone is a 400; with none, UTC).
- `backend/accountable/migrate.py` (new): `upgrade(engine)` runs the migrations and says whether it created the database. A local SQLite file from before this change (tables but no `alembic_version`) is stamped at the first revision, then upgraded.
- `backend/migrations/env.py`, `backend/migrations/script.py.mako`, `backend/migrations/versions/0001_mvp_schema.py`, `backend/migrations/versions/0002_who_added.py` (new). 0002 fills existing rows with "Sample data" and converts their times from the computer's own zone to UTC, so a local file's times don't shift.
- `backend/accountable/seed.py`: every row by "Sample data"; times built in the computer's own zone (UTC on Render) and stored as UTC; `python -m accountable.seed` always opens the local SQLite file, never `DATABASE_URL`.
- `backend/tests/test_migrate.py` (new), `backend/tests/test_seed.py`, `backend/tests/test_db.py` (new); helpers `backend/tests/mvp_schema.sql` (the MVP's tables, for the old-file upgrade) and `backend/tests/computer_zone.py` (runs code as if the computer were in another zone) (new).

### 3. Backend sign-in and the app

- `backend/accountable/settings.py` (new): reads `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` and `ACCOUNTABLE_DB`/`ACCOUNTABLE_RESET`; `is_local` when `DATABASE_URL` is empty. Refuses to start on Render (`RENDER` set) without `DATABASE_URL`, so the test sign-in can never run there.
- `backend/accountable/auth.py` (new): `User`, the Supabase token check (keys come from a function, so tests pass their own), the local token check, `CurrentUser`, and the routes `/api/config`, `/api/local-sign-in`, `/api/me`.
- `backend/accountable/web.py` (new): serves `frontend/dist` when it exists, with `index.html` for any address that isn't `/api/...` or a file.
- `backend/accountable/main.py`: lifespan from settings, `make_engine` and `upgrade` (seeds when created, or local with `ACCOUNTABLE_RESET=1`); every record router included with `dependencies=[Depends(current_user)]`; the search router in phase 2; `web` last.
- `backend/tests/conftest.py`: migrates one template SQLite file per test session and copies it for each test (keeps each test well under a second); `client` is signed in as Test User; a `signed_out_client`.
- `backend/tests/test_auth.py`, `backend/tests/test_settings.py`, `backend/tests/test_web.py` (new); `backend/tests/test_health.py`.

### 4. Backend records: who added and changed

- `backend/accountable/organizations.py`, `contacts.py`, `deals.py`, `activities.py`: each write takes `CurrentUser` and passes its name.
- `backend/accountable/rules.py`: automatic entries and the contact's status change carry the name of the person whose change wrote them; an automatic entry's time is now in UTC, to the minute.
- `backend/accountable/schemas.py`: `created_by` and `updated_by` on `Record`; `happened_at` in `ActivityIn` is Pydantic's `AwareDatetime`, so a time without a zone is refused.
- `backend/tests/test_organizations.py`, `test_contacts.py`, `test_deals.py`, `test_activities.py`, `test_rules.py`, `test_dashboard.py` (only where signatures change); helper `backend/tests/other_user.py` (new), whose `sign_in_as(client, name)` makes requests come from someone else.

### 5. Backend search

- `backend/accountable/search.py` (new): the router and its response models.
- `backend/tests/test_search.py` (new).

### 6. Frontend sign-in

- `frontend/src/auth/config.ts` (new): loads `/api/config`.
- `frontend/src/auth/session.ts` (new): a local session (token in `localStorage`) and a Supabase session (`supabase-js`), behind one shape: `signIn`, `signOut`, `token`, `onChange`.
- `frontend/src/auth/AuthProvider.tsx` (new): holds the session and the user from `/api/me`; `useAuth()`; shows `SignIn` while signed out.
- `frontend/src/auth/SignIn.tsx`, `frontend/src/auth/sign-in.css` (new): the screen in `sign-in.md`, with the local-run line in local mode.
- `frontend/src/api/client.ts`: the bearer token and `X-Time-Zone` on every call; a 401 signs out.
- `frontend/src/api/types.ts`: `User`; `created_by` and `updated_by` on `Stamped`.
- `frontend/src/App.tsx`, `frontend/src/main.tsx`: config first, then `AuthProvider` around the router.
- `frontend/src/test/fakeApi.ts`, `frontend/src/test/renderApp.tsx`: signed in by default, with `/api/config` and `/api/me`; stamps with `created_by`.
- `frontend/src/auth/session.test.ts`, `frontend/src/auth/SignIn.test.tsx`, `frontend/src/api/client.test.ts` (new).
- `playwright.config.ts`: `DATABASE_URL: ""` for the backend; a setup project that signs in once through the screen and saves the browser state for the other tests.
- `e2e/auth.setup.ts`, `e2e/sign-in.spec.ts` (new); `e2e/fixtures.ts` lets 401 console errors through.
- `frontend/src/pipeline/boardMath.test.ts`: the new stamp fields.

### 7. Frontend records: who added

- `frontend/src/pages/RecordPage.tsx`, `frontend/src/pages/record-page.css` (new): "Added by … on …" and "Last changed by … on …"; `Organization.tsx`, `Contact.tsx` and `Deal.tsx` pass the record to `Details`.
- `frontend/src/components/Timeline.tsx`: "by <name>" on each entry.
- `frontend/src/forms/ActivityForm.tsx`: sends `happened_at` as an ISO string with the browser's offset, and shows a saved one in the browser's zone when editing (today it slices the string, which would show UTC).
- `frontend/src/pages/Organization.test.tsx`, `Contact.test.tsx`, `Deal.test.tsx`, `frontend/src/pages/RecordPage.test.tsx` (new), `frontend/src/components/Timeline.test.tsx`, `frontend/src/forms/ActivityForm.test.tsx`.
- `e2e/who-added.spec.ts` (new).

### 8. Frontend search

- `frontend/src/search/useSearch.ts`, `frontend/src/search/SearchBox.tsx`, `frontend/src/search/search.css` (new).
- `frontend/src/search/SearchBox.test.tsx` (new).
- `e2e/search.spec.ts` (new).

### 9. Frontend top bar and user menu

- `frontend/src/components/NavBar.tsx`: the search box (phase 2), then the user menu in place of the toggle (phase 3).
- `frontend/src/components/UserMenu.tsx`, `frontend/src/components/user-menu.css` (new).
- `frontend/src/lib/initials.ts` (new).
- `frontend/src/lib/theme.ts`: Light, Dark or System; System follows `prefers-color-scheme` and its changes.
- `frontend/index.html`: the inline script also resolves System before the first paint.
- `frontend/src/components/ThemeToggle.tsx`, `ThemeToggle.test.tsx`: deleted.
- `frontend/src/styles/app.css`: the toggle's styles go.
- `frontend/src/test/setup.ts`: a `matchMedia` stub for jsdom.
- `frontend/src/components/NavBar.test.tsx`, `frontend/src/components/UserMenu.test.tsx` (new), `frontend/src/lib/initials.test.ts` (new), `frontend/src/lib/theme.test.ts`.
- `e2e/theme.spec.ts`: rewritten for the menu.
- `e2e/journey.spec.ts`, `e2e/records.spec.ts`, `e2e/tables.spec.ts`: the Organization list picked with `exact: true`, since the search box's label also matched.
- `frontend/src/styles/tokens.css`: a comment that named the toggle.

### 10. Docs and agents

- `docs/STATUS.md`: this change's build steps; how to run with `npm start`.
- `docs/TECH_STACK.md`: Postgres on Supabase, Supabase Auth, Render, and the four new dependencies.
- `.claude/agents/ui-check.md`: sign in as `test@example.com` with `test`; check the sign-in screen, the search dropdown and the menu.
- `docs/changes/multi-user/plan.md`: departures, under "Changes during build".
- `docs/specs/*.md`, `docs/spec.md`: only if the build departs from them. The time zone decision is already in `docs/specs/app-shell.md`.

## Order of work

Each step ends with `npm run check:quick` passing, and each phase with `npm run check`. Tests come first in each step: write them, watch them fail, then build. Steps on one line can run side by side.

**Phase 1: sign-in and the database**

1. Part 1: the dependencies and `npm start` (not `render.yaml` yet). Nothing else changes, so every check stays green.
2. Part 2: migrations, `make_engine`, Unicode `lower`, the new columns, UTC times and `Today` from `X-Time-Zone`, the seed by "Sample data", and `insert_row(by=)`. To keep the build green before part 4 lands, `by` defaults to "Sample data" for this step only; part 4 removes the default.
3. Part 3: settings, the token checks, `CurrentUser`, the three auth routes, the routers guarded, the signed-in `conftest.py`, `web.py`. Part 4 in parallel: each write passes the user's name, and the default from step 2 goes.
4. Part 6: config, sessions, the sign-in screen, the token and time zone on every call, the signed-in test helpers, the Playwright setup project and `e2e/sign-in.spec.ts`. Part 7 in parallel: "Added by", "by <name>" and the activity form's times with their zone.
5. Part 1 again: `render.yaml`. Then with a real Supabase project: confirm its signing key is asymmetric, add a user with a display name, and run `npm start` against it. Sign in, add a deal, check "Added by" shows that name, restart and check it's still there and the sample data wasn't added twice (criterion 6). Deploying to Render itself is the Deploy step.

**Phase 2: search**

6. Part 5: `GET /api/search`, then part 3 includes its router in `main.py`. Part 8 in parallel against the agreed response shape.
7. Part 9: the search box in `NavBar.tsx`. Then `e2e/search.spec.ts` (part 8).

**Phase 3: the user menu**

8. Part 9: `initials.ts`, the three-way `theme.ts` and the inline script, `UserMenu.tsx`, the menu in `NavBar.tsx` in place of the toggle, which is deleted with its styles; `e2e/theme.spec.ts` rewritten.

**Finally**

9. Part 10: docs and `ui-check.md`; run ui-check on `npm run dev`; `npm run check`; record any departures in this file.

## Risks

- **The test sign-in reaching the shared app.** It's on only when `DATABASE_URL` is empty, and the app refuses to start on Render without it. Unit tests prove the local token is refused when `DATABASE_URL` is set.
- **Tests or `npm run dev` touching Supabase.** Only `npm start` reads `.env`. `conftest.py` clears `DATABASE_URL` and the Supabase settings, and `playwright.config.ts` sets `DATABASE_URL` to empty, in case a shell exports it. Criterion 1 is checked by running `npm run check` with the settings in `.env` and the network off.
- **The Supabase project signs tokens with the legacy shared secret.** Then the JWKS has no keys and every token fails. Step 5 checks the project's signing keys first; if it's legacy, rotate to an asymmetric key in Supabase's dashboard rather than putting a secret in the backend.
- **Where the display name lives in the token.** Assumed `user_metadata.display_name`. Step 5 decodes a real token to confirm it before relying on it.
- **A signed-out token still works until it expires** (an hour by default), because tokens are checked locally. Signing out drops it from the browser, so only a copied token could be reused. Acceptable for a small team with no roles.
- **Supabase reseeded by accident.** The sample data goes in only when the migrations create the database. `npm run seed` and `ACCOUNTABLE_RESET=1` only ever open the local file. A unit test proves a second start doesn't seed.
- **Old local databases.** A `data/accountable.db` from before this change has no `alembic_version`; `migrate.py` stamps it at 0001 so 0002 adds the new columns. A unit test builds one with the MVP's tables and upgrades it.
- **Migrations drift from `db.py`.** A unit test compares the migrated schema to `metadata` with Alembic's `compare_metadata`, so an unmigrated column fails the build.
- **Case folding and sorting differ** between SQLite and Postgres. The registered `lower` covers matching ("ÉMILE" finds "Émile" on both); search results sort by `lower(name)`. Tables sort in the browser, so they aren't affected.
- **Times shifting by the zone offset.** Render runs in UTC, so a time stored or shown as naive would be hours off. Every time column is `UtcDateTime`, which refuses a naive datetime, and the API sends `Z`. Unit tests check a time round-trips unchanged on SQLite, and an end-to-end test runs the browser in a zone far from UTC.
- **"Today" differs between people** in different zones: near midnight one person's deal is late and another's isn't. That's the agreed behaviour, written in `app-shell.md`. Sample data's dates are relative to the server's day when it's seeded, so they can be a day off for some people; harmless.
- **Render's Python runtime and Node.** The build needs Node for the frontend. If Render's Python runtime doesn't have a suitable Node, a small `Dockerfile` replaces the native runtime; recorded here if so.
- **Supabase free projects pause** after a week unused and drop idle connections. `pool_pre_ping` reconnects; a paused project needs resuming in the dashboard.
- **Headless UI's `Menu` closes on any pick**, but picking a theme must leave it open. If the theme items can't keep it open, the menu becomes a `Popover` with its own Up/Down handling. The unit test catches it either way.
- **Unit test speed.** Running migrations per test would be slow on CI; copying one migrated template file per test keeps each test well under a second. pytest's `--durations` is checked at the end of each phase.
- **Parts built side by side drift apart.** The interfaces at the top of "Files that change" are the contract; any change to them is recorded here first.

## Proof

Each success criterion is covered by the tests below: 1 by `npm run check` itself, 2 by the sign-in tests, 3 by the who-added tests, 4 by the search tests, 5 by the theme tests, and 6 by step 5 by hand, since tests never touch Supabase.

**Backend unit tests (pytest)**

`test_settings.py`
- Empty or missing `DATABASE_URL` is local; set, it's shared, with the Supabase settings.
- On Render without `DATABASE_URL`, starting fails.

`test_db.py`
- A Postgres `DATABASE_URL` gives a `postgresql+psycopg` engine (built, not connected).
- On SQLite, `lower('ÉMILE')` is `'émile'`.
- A time saved with a +14:00 offset comes back as the same instant, in UTC; a naive one is refused.
- Today for a given instant: at 23:30 UTC on 15 Nov, `Pacific/Kiritimati` gives 16 Nov and `America/Los_Angeles` 15 Nov; no header gives UTC's day; an unknown zone is a 400.

`test_migrate.py`
- An empty file is migrated to head and reported as created; a second upgrade reports not created.
- The migrated schema matches `metadata` (`compare_metadata` finds nothing).
- A file with the MVP's tables and rows and no `alembic_version` upgrades, keeps its rows, and they show "Sample data", with their times converted from the computer's zone to UTC.

`test_auth.py`
- Every API route except health, config and local sign-in answers 401 with no token and with a wrong one (one check over all the app's routes).
- Local sign-in: right email and password give a token, `/api/me` with it gives Test User; a wrong password gives 401.
- Supabase check, with a key pair made in the test: a valid token gives the display name and email; with no display name the name is the email; expired, wrong audience or signed by another key gives 401.
- With `DATABASE_URL` set, the local token gives 401 and `/api/local-sign-in` doesn't exist.
- A user field in the request body is ignored: the name comes from the token.
- `/api/config` gives the mode, and in Supabase mode only the URL and the publishable key.

`test_web.py`
- With a built `index.html` in a temporary folder, `/` and `/deals/12` serve it, a file under `assets/` is served as itself, and `/api/nothing` is a JSON 404, not the page.

`test_seed.py`
- Every seeded row and automatic entry is by "Sample data".
- Starting on a new database seeds it; starting again doesn't.

`test_organizations.py`, `test_contacts.py`, `test_deals.py`, `test_activities.py`
- Creating sets `created_by` and `updated_by` to the signed-in name; an edit by someone else changes only `updated_by`.

- Records and activities give their times ending in `Z`; logging an activity without a zone is a 422.

`test_rules.py`
- A stage move's automatic entry, and a win's status change on the contact, are by the person who moved the deal.
- A drop marks only the moved deal as changed: the other deals in its column keep who last changed them and when, both after a move to another column and after a reorder within one.
- A deal won with `X-Time-Zone: Pacific/Kiritimati` closes on that zone's today.

`test_search.py`
- Part of a name in any case finds an organization, a contact and a deal.
- "%" and "_" match only themselves.
- Up to 5 of each kind, sorted by name; contacts and deals carry their organization's name.
- Spaces at either end are ignored; an empty query gives three empty lists.
- Only names match, not emails or notes.

**Frontend unit tests (Vitest)**

`auth/session.test.ts`
- The local session signs in through `/api/local-sign-in`, keeps the token after a reload, and drops it on sign out; `onChange` fires each time.

`auth/SignIn.test.tsx`
- The fields, the heading and the "Ask whoever runs Accountable to add you." line; the local-run line only in local mode.
- While signing in the button is disabled and says "Signing in…".
- A 401 shows "Wrong email or password." and empties the password; a network failure shows "Couldn't sign in. Try again."
- Signed out at `/deals/12`, signing in shows that deal.

`api/client.test.ts`
- Every call sends the bearer token and the browser's zone as `X-Time-Zone`; a 401 signs out.

`forms/ActivityForm.test.tsx`
- Saving sends `happened_at` with the browser's offset; editing an entry saved as `…T08:00:00Z` shows it in the browser's zone (Vitest runs with `TZ` set to a zone away from UTC).

`pages/Organization.test.tsx`, `Contact.test.tsx`, `Deal.test.tsx`
- "Added by Sam Lee on 3 Nov 2026"; "Last changed by …" only once changed.

`components/Timeline.test.tsx`
- Each entry shows "by <name>".

`search/SearchBox.test.tsx`
- Typing shows the groups in order with their hints; a group with no matches is hidden; no matches shows "No matches for "<text>"".
- The first match is highlighted; Down then Enter opens the second match's page and empties the box; a click opens a match.
- Escape and a click outside close the dropdown and keep the text, and typing again reopens it; an empty box closes it.

`lib/initials.test.ts`
- "Ingo Prause" gives "IP", "Ingo van Prause" gives "IP", "Cher" gives "C", an email gives its first letter in capitals.

`lib/theme.test.ts`
- Nothing stored is Light.
- Dark sets `data-theme="dark"`; Light removes it; each is stored.
- System follows the stubbed `prefers-color-scheme`, and switches when it changes, with no reload.

`components/UserMenu.test.tsx`
- The button shows the initials and is named "Account menu for <name>".
- The menu shows the name and email, Light, Dark and System with the current one checked, then Sign out.
- Picking Dark applies it and leaves the menu open; Sign out signs out.
- Up and Down move through the choices; Escape and a click outside close it.

`components/NavBar.test.tsx`
- The order: brand, five sections, search box, Add deal, the user menu; no dark mode button.

**End-to-end tests (Playwright, local mode, never Supabase)**

`e2e/auth.setup.ts`
- Signs in as Test User through the screen and saves the state the other specs start from.

`e2e/sign-in.spec.ts` (starts signed out)
- Every section and a record's address show the sign-in screen with no top bar, and `/api/organizations` answers 401.
- A wrong password shows "Wrong email or password."
- Signing in at `/pipeline` opens the pipeline; a reload keeps you signed in.
- Sign out in the menu shows the sign-in screen at once, and a reload stays signed out.
- When the token is removed while signed in, the next request shows the sign-in screen, and signing in returns to the same page.

`e2e/who-added.spec.ts`
- A new organization's page says "Added by Test User on <today>"; after an edit, "Last changed by Test User".
- A logged activity shows "by Test User"; a sample deal's page says "Added by Sample data".
- With the browser in `Pacific/Kiritimati`, an activity logged at 09:15 shows 09:15 after a reload, and a deal moved to Won shows today's date in that zone as its close date.

`e2e/search.spec.ts`
- Typing part of a sample organization's name in another case shows it under Organizations; Enter opens its page.
- The same for a contact and a deal, by click; the box empties and the dropdown closes.
- A query with no matches shows "No matches for …".

`e2e/theme.spec.ts`
- A first visit is Light, with Light checked in the menu.
- Dark from the menu switches the page with no reload and leaves the menu open; it is still dark after a reload and after signing out (the sign-in screen is dark).
- System with Chrome emulating dark is dark, and switching the emulation to light changes the page with no reload.
- With the app's script blocked, a reload in Dark or System-dark still sets `data-theme="dark"` before React runs.
- A new browser context starts Light.

The existing end-to-end specs run unchanged, signed in by the setup project.

## Changes during build

Where the build departed from this plan:

- **`make_engine(database_url)`**, not `make_engine(settings)`: it needs only the URL, and `None` or `""` means the local SQLite file at `db_path()`. `ACCOUNTABLE_DB` is still read by `db.db_path()`; `ACCOUNTABLE_RESET` is `Settings.reset`.
- **Settings are read in `create_app()`**, not the lifespan, because which routes exist (`/api/local-sign-in` only in local mode) depends on them. `create_app(frontend=FRONTEND_DIST)` takes the built frontend's folder, so `test_web.py` passes a temporary one. `Settings` is a frozen dataclass with `is_local` and `jwks_url` (`<SUPABASE_URL>/auth/v1/.well-known/jwks.json`).
- **Tokens:** ES256 and RS256 are accepted. Tests pass their keys through `app.state.find_signing_key`. A failed check is a 401 `{"detail": "Not signed in"}` with `WWW-Authenticate: Bearer`. The local token is `local-test-user` (`auth.LOCAL_TOKEN`); a wrong local sign-in is a 401 "Wrong email or password". FastAPI 0.163 nests included routers, so the 401 sweep in `test_auth.py` walks `app.openapi()["paths"]`.
- **`web.py`** is a `StaticFiles` subclass; anything under `/api/` is a JSON 404 for every method.
- **Today with no `X-Time-Zone` is UTC's day** (it was the computer's), through a pure `today_in(zone, now)` that `get_today` calls. The lifespan seeds a new database with that day; `npm run seed` still uses the computer's own day.
- **Times on Postgres** are `timestamp without time zone` holding UTC, the same as on SQLite; `UtcDateTime` adds the zone back when reading.
- **Migrations:** no downgrades. SQLite's foreign key checks are off while they run, because batch mode rebuilds tables, and back on after. 0002 adds the columns nullable, fills them with "Sample data", converts times to UTC row by row in Python (so daylight saving is right), then makes the columns NOT NULL. `[tool.alembic]` holds only `script_location`.
- **One instant for both stamps.** `insert_row` stamped `created_at` and `updated_at` from two calls, microseconds apart, and the page shows "Last changed" only when they differ. `db.new_stamps(by)` now gives all four stamps at one instant, and the seed uses it too. So sample contacts made customers show "Last changed by Sample data": the seed changed them after adding them. The step 2 bridges (`by` defaulting to "Sample data", naive times read in the computer's zone, an xfail in `test_db.py`) are gone.
- **`updated_by` follows `updated_at`**, including side effects: deleting an organization or contact marks the records that pointed to it as changed by the person deleting. A pipeline drop marks only the moved deal (the user's choice): the column is renumbered with each deal's `updated_at` kept, then the moved deal gets `updated_by`, and its `updated_at` changes even when only its place did.
- **rules.py signatures:** `log_auto(conn, description, by, **record)` (it takes the time itself, so no `today`), `win_for_contact(conn, contact_id, by)`, `change_stage(..., today, by)`, `move_deal(..., today, by)`.
- **Search:** names equal ignoring case are ordered by id. A missing `q` is an empty query. The response models are `Match`, `MatchWithOrganization` and `SearchResults`.
- **Only a pick empties the search box**; Escape and a click outside close the dropdown and keep the text (the user's choice). Headless UI sets the input to `displayValue(value)` when the dropdown closes, and `value` is always `null`, so `ComboboxInput` gets `displayValue={() => text}`. The dropdown is `modal={false}`, because Headless UI's default locks the page's scroll and makes the rest of the page inert. The box is 240 pixels wide and the dropdown 340, 6 pixels below it, left-aligned.
- **The user menu is a Headless UI `Popover`**, the plan's fallback: in 2.2.10 `MenuItem` closes on click and `MenuItems` after Enter, so a theme pick couldn't leave a `Menu` open. The panel has role `menu`, the themes `menuitemradio`, Sign out `menuitem`; Up and Down wrap.
- **The sign-in screen follows System live too**: `SignIn.tsx` calls `useTheme()` for its listener, which otherwise lived only in the menu.
- **Frontend sign-in:** the session shape adds `local`, and `token()` is async (supabase-js may refresh). The local token is kept under `accountable.token`. If `/api/me` fails the app treats it as signed out, and signing out clears the React Query cache. `main.tsx` loads the config with a top-level await and passes the session to `App`.
- **Activity times:** `ActivityForm` sends `formatISO(parseISO(value))`, the local time with its offset. `ActivityForm.test.tsx` runs in `Pacific/Kiritimati` with `vi.stubEnv("TZ", ...)` and a guard test that the zone took effect. The end-to-end close-date check in Kiritimati only tells the zones apart when it runs between 10:00 and 24:00 UTC.
- **"Last changed" shows when `updated_at` differs from `created_at`.** `Details` in `RecordPage.tsx` takes a required `stamped` prop, so the organization, contact and deal pages each pass it (one line each). The "Last changed" case is tested in a new `RecordPage.test.tsx`, because the fake API can't serve a changed record.
- **End-to-end sign-in:** the `chrome` project sends `Authorization: Bearer local-test-user` as `extraHTTPHeaders`, because the specs call the API with `page.request` and the token lives in localStorage, not a cookie. Playwright adds these headers to the browser's requests too, so the signed-in specs don't prove the app sends its token; `sign-in.spec.ts`, which clears them, and `client.test.ts` do. The saved state is `test-results/auth/test-user.json` (`SIGNED_IN` in `playwright.config.ts`). `e2e/fixtures.ts` also lets "status of 401" console errors through, as it did 422s.
- **Existing specs changed after all:** `journey.spec.ts`, `records.spec.ts` and `tables.spec.ts` pick the Organization list with `exact: true`. Playwright matches names by substring, so the search box's label "Search organizations, contacts and deals" also matched and failed strict mode. Seen, not fixed, and older than this change: when Add deal opens straight after the Add contact dialog closes, the top bar stays in the accessibility tree behind the second dialog.
- **render.yaml** sets `region: frankfurt`, Render's only EU region and the closest to the Supabase database in eu-west-1; without it Render uses Oregon, and the region can't be changed after the service is created. It pins `PYTHON_VERSION` 3.12.12 and `NODE_VERSION` 24.22.3 (CI's Node 24), and has `branch: main` and `autoDeployTrigger: checksPass`, so Render deploys `main` when CI passes. Render's Python runtime has Node and npm, so there's no Dockerfile. The build leaves out the dev tools with `uv sync --frozen --no-dev`, and the start command is `uv run --no-dev`, since a plain `uv run` would install them again. Not yet tried on Render.
- **ui-check can type:** `.claude/agents/ui-check.md` gains the `browser_type` tool, which it needs to sign in and to type in the search box.
- **Step 5's check against a real Supabase project** was run: the signing key is ES256, sign-in works, records show "Added by" the display name (the email when there is none), they survive a restart, and the sample data went in once.
- **Fixes from the review at Deploy:** a valid token with no email (or a null or empty one) is a 401, where it was a 500, and a null `user_metadata` goes by the email. The backend accepts any account on the Supabase project, so sign-ups and anonymous sign-ins are turned off there (done); `sign-in.md` and `running.md` say so.
- **Fixes from the ui-check at Test**, outside the plan: phone numbers in the Contacts table wrapped onto two lines, so `table.data td.mono` is now `nowrap`. In the search dropdown a long deal name squeezed the organization hint to "Calder Fo…", so `.search-hint` no longer shrinks and is capped at half the row. In dark mode the Add deal dialog was black over a dimmed black panel, so `.dialog-panel` now uses `--raised`, as the menus and the chart tooltip do (the user's choice). This reverses the dark-mode plan's "the Add deal dialog uses the dark panel color", and `e2e/theme.spec.ts` now expects the raised color. Left as they are: websites in mono (the brand allows mono for identifiers) and the browser's own date input format.
- **Files outside their part:** `Timeline.test.tsx` (part 7's) and `boardMath.test.ts` (no part) gained the new stamp fields so tsc passes; `tokens.css` says the dark theme is set from the user menu.
