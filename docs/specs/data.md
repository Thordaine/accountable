# Data and sample data

Part of the spec; [`docs/spec.md`](../spec.md) has the summary and the index.

The data lives in one SQLite file, `data/accountable.db`, or the file named by `ACCOUNTABLE_DB`. A new database gets the sample data by itself. `npm run seed` replaces all data with the sample data, and so does starting with `ACCOUNTABLE_RESET=1`.

- 15 organizations across several industries, 40 contacts at every status, 50 deals and 80 logged activities, plus the automatic entries for the deals' stage moves and the contacts who became customers.
- Deals: 16 open across the four open stages, 25 won and 9 lost, so every month in the last 12 has between 0 and 4 deals won.
- Dates are relative to the day it's seeded, so it always looks current: deals won and lost spread over the past 12 months, open deals closing over the coming months, three of them late, and follow-ups overdue, due in the next few days, due later and done.
- Names, companies and descriptions are realistic and plausible, not lorem ipsum.
