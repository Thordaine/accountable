# Running Accountable

Part of the spec; [`docs/spec.md`](../spec.md) has the summary and the index. Where the data lives is in [data.md](data.md).

## The shared app

- The team uses one Accountable on the web, at its onrender.com address on Render's free plan, in Render's Frankfurt region, the closest to the Supabase database in eu-west-1 (Ireland). It needs an internet connection, for Supabase.
- One web service serves both the app and its API. It brings the database up to date each time it starts.
- `render.yaml` describes the service. The Supabase settings are entered in Render, never written in the file.
- Render deploys `main` each time CI passes on it.
- On the free plan, Render puts the app to sleep when nobody has used it for 15 minutes, so the first visit after that can take about a minute.

## Settings

The shared app needs three settings, kept in `.env` on this computer and entered in Render: `DATABASE_URL` (Supabase's session pooler), `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`. The browser is given only the publishable key.

The Supabase project must have sign-ups and anonymous sign-ins turned off (Authentication settings), since the server lets in anyone with a Supabase account on the project.

## On this computer

- `npm run dev` runs the app with a local SQLite database and a test sign-in. It never touches Supabase and needs no internet connection, even when `.env` holds the Supabase settings. ui-check uses it.
- The test sign-in has one made-up person, Test User (`test@example.com`), with the password `test`. The sign-in screen of a local run says "Local run: sign in as test@example.com with the password test." No real password is used.
- `npm start` builds the app and runs it the way Render does, against Supabase with the settings in `.env`, at http://localhost:8000.
- The tests use their own SQLite databases and the test sign-in. They never touch Supabase and need no internet connection, and CI needs no secrets.
