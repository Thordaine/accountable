This project will use the following high level technical stack:

1. Node.js 26, the current LTS (24 or later works) / TypeScript for the frontend, using React and Vite, in `frontend/`
2. Python 3.12 for the backend using uv, with FastAPI, in `backend/`, with `pyproject.toml` and `uv.lock` at the repo root

The frontend gets its data from the backend's JSON API. The backend uses SQLAlchemy Core with no raw SQL, and fills a new database with the sample data. Alembic migrations bring the database up to date each time the app starts.

- **The shared app** keeps its data in Postgres on Supabase (through psycopg), and people sign in with Supabase Auth: the browser uses `@supabase/supabase-js`, and the backend checks each token against the project's public keys with PyJWT. It's deployed to Render as one web service, described in `render.yaml`, that serves the API and the built frontend.
- **`npm run dev` and the tests** use a local SQLite file and a test sign-in, and never touch Supabase. Setting `DATABASE_URL` is what switches to Supabase; only `npm start` reads it from `.env`.

Backend dependencies beyond FastAPI and SQLAlchemy: `psycopg[binary]` (the Postgres driver), `alembic` (migrations), `pyjwt[crypto]` (token checks) and `tzdata` (the time zone database, which Windows lacks).

Prefer popular, well-supported libraries to custom code, such as for the data tables, the charts and the drag-and-drop pipeline. Don't hand-roll what a mature library does well.

Commands are npm scripts in a `package.json` at the repo root, with `frontend/` as an npm workspace, so they work the same on Mac, Linux and Windows:

- `npm run dev` starts the backend and the frontend together
- `npm test` runs all the tests and fails if any test fails
- `npm start` builds the frontend and runs the app against Supabase, the way Render does
- `npm run seed` resets the local database to the sample data

`docs/STATUS.md` says how to run the app. `README.md` is the course's own guide, so leave it as it is.

Testing will cover:

1. Unit tests for the frontend, using Vitest
2. Unit tests for the backend, using pytest
3. End-to-end tests of the whole app in a browser, in `e2e/`, using Playwright Test (`@playwright/test`) with the installed Google Chrome. They start the app themselves, so `npm test` needs nothing else running.

The tests use a database of their own, so running them never changes your data.
