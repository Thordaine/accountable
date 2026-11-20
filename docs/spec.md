# Spec: Accountable

What Accountable does today. This is the description of the product: this file is its summary and index, and the detail lives in one file per area in `docs/specs/`. Every change that alters what the product does updates the files it affects. `docs/TECH_STACK.md` says what it's built with.

## Problem

A small business keeps track of its customers and sales in spreadsheets, inboxes and people's heads. Nobody can see at a glance which companies we deal with, who our contacts are, what's in the sales pipeline, what happened last with a customer or what needs doing next.

## Product

Accountable is a business management system: a sales CRM that will grow into a full Business OS, including ERP. Today it is a complete sales CRM for a small sales team, shared on the web: a private Salesforce that does the everyday CRM essentials really well, and feels sharp, modern and professional.

- A small team shares one Accountable on the web, deployed to Render. Everyone signs in with an email and password and works on the same organizations, contacts and deals, and each record shows who added it. There's no sign-up: people are added in Supabase's dashboard. Everyone can do everything.
- The data lives in Postgres on Supabase, so the shared app needs an internet connection.
- It also runs locally with one command (`npm run dev`) on Mac, Linux and Windows, with its own data and a test sign-in, and needs no internet connection.
- A search box in the top bar finds any organization, contact or deal by name, and a menu under your initials holds the theme (Light, Dark or System) and signing out.
- It supports Google Chrome. Other modern browsers will probably work, but aren't checked.
- It stays quick with up to about 1,000 records of each kind.
- Every change is saved at once, and is still there after a browser refresh and after a restart.
- One command (`npm run seed`) resets the local data to the sample data. The shared app's data is never reset.

## Areas

| Area | File | What it covers |
|---|---|---|
| App shell | [`specs/app-shell.md`](specs/app-shell.md) | Sections, top navigation bar, addresses, screen sizes, other people's changes, confirmations, the user menu, themes |
| Records, tables and forms | [`specs/records.md`](specs/records.md) | What every record has, deleting, tables, forms, not found pages |
| Organizations | [`specs/organizations.md`](specs/organizations.md) | Organization fields, its delete, table and page |
| Contacts | [`specs/contacts.md`](specs/contacts.md) | Contact fields and statuses, its delete, table and page |
| Deals | [`specs/deals.md`](specs/deals.md) | Deal fields, open and late deals, stages and probability, expected revenue, its delete, table and page |
| Activities and timelines | [`specs/activities.md`](specs/activities.md) | Activity fields, automatic entries, timelines, follow-ups, logging an activity |
| Pipeline | [`specs/pipeline.md`](specs/pipeline.md) | The board, dragging cards, column figures |
| Dashboard | [`specs/dashboard.md`](specs/dashboard.md) | Open pipeline, charts, sales funnel, follow-ups, recent activity |
| Sign-in and people | [`specs/sign-in.md`](specs/sign-in.md) | The sign-in screen, staying signed in, signing out, names and initials, who added a record |
| Search | [`specs/search.md`](specs/search.md) | The search box in the top bar and its dropdown of matches |
| Look and feel | [`specs/look-and-feel.md`](specs/look-and-feel.md) | Fonts, colors, contrast, money, labels, mockups |
| Data and sample data | [`specs/data.md`](specs/data.md) | Where the data lives, seeding, the sample data |
| Running Accountable | [`specs/running.md`](specs/running.md) | The shared app on Render, its settings, local runs, the test sign-in, `npm start` |

## Not built

Roles and permissions; a sign-up page; signing in with Google or magic links, and password resets; moving data from a local SQLite file to Supabase; live updates of other people's changes; phone layouts; AI features; email, calendar or phone integrations; currencies other than US dollars; reports beyond the dashboard; tags and custom fields; changing the pipeline stages; importing and exporting data.
