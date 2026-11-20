# Spec: Accountable

What Accountable does today. This is the description of the product: this file is its summary and index, and the detail lives in one file per area in `docs/specs/`. Every change that alters what the product does updates the files it affects. `docs/TECH_STACK.md` says what it's built with.

## Problem

A small business keeps track of its customers and sales in spreadsheets, inboxes and people's heads. Nobody can see at a glance which companies we deal with, who our contacts are, what's in the sales pipeline, what happened last with a customer or what needs doing next.

## Product

Accountable is a business management system: a sales CRM that will grow into a full Business OS, including ERP. Today it is a complete sales CRM for one salesperson, running on their own computer: a private Salesforce that does the everyday CRM essentials really well, and feels sharp, modern and professional.

- One user, with no sign-in. No other systems are involved.
- It runs locally with one command (`npm run dev`) on Mac, Linux and Windows, and needs no internet connection.
- It supports Google Chrome. Other modern browsers will probably work, but aren't checked.
- It stays quick with up to about 1,000 records of each kind.
- Every change is saved at once, and is still there after a browser refresh and after a restart.
- One command (`npm run seed`) resets the data to the sample data.

## Areas

| Area | File | What it covers |
|---|---|---|
| App shell | [`specs/app-shell.md`](specs/app-shell.md) | Sections, top navigation bar, addresses, screen sizes, light and dark mode, offline, confirmations |
| Records, tables and forms | [`specs/records.md`](specs/records.md) | What every record has, deleting, tables, forms, not found pages |
| Organizations | [`specs/organizations.md`](specs/organizations.md) | Organization fields, its delete, table and page |
| Contacts | [`specs/contacts.md`](specs/contacts.md) | Contact fields and statuses, its delete, table and page |
| Deals | [`specs/deals.md`](specs/deals.md) | Deal fields, open and late deals, stages and probability, expected revenue, its delete, table and page |
| Activities and timelines | [`specs/activities.md`](specs/activities.md) | Activity fields, automatic entries, timelines, follow-ups, logging an activity |
| Pipeline | [`specs/pipeline.md`](specs/pipeline.md) | The board, dragging cards, column figures |
| Dashboard | [`specs/dashboard.md`](specs/dashboard.md) | Open pipeline, charts, sales funnel, follow-ups, recent activity |
| Look and feel | [`specs/look-and-feel.md`](specs/look-and-feel.md) | Fonts, colors, contrast, money, labels, mockups |
| Data and sample data | [`specs/data.md`](specs/data.md) | Where the data lives, seeding, the sample data |

## Not built

Sign-in, user accounts and several users; following the device's own dark mode setting; phone layouts; AI features; email, calendar or phone integrations; currencies other than US dollars; reports beyond the dashboard; tags and custom fields; changing the pipeline stages; importing and exporting data; making Accountable available beyond the computer it runs on.
