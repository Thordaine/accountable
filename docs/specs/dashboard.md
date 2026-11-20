# Dashboard

Part of the spec; [`docs/spec.md`](../spec.md) has the summary and the index.

All figures come from the data. Money is in US dollars, and "last 12 months" means the current month and the 11 before it. The title shows today's date, such as "Monday 16 November 2026".

The layout follows mockup B, top to bottom:

1. **Open pipeline**, full width. The open pipeline's total value, large, with the expected revenue, the number of open deals (and how many are late, in Raspberry) and the win rate in the last 12 months beside it. Below, a band split into the open stages that have deals, each roughly as wide as its share of the value, showing its value, number of deals and expected revenue, with the expected revenue shaded inside it and a legend explaining the shading. Each stage links to the Pipeline board. With no open deals, "No open deals". Win rate is deals won divided by deals won or lost, by close date, as a whole percent, or "—" when none closed.
2. **Two charts** side by side:
   - **Revenue won** (line chart, filled below): per month over the last 12 months, with the best month marked, and the 12 months' total in its header.
   - **Deals won and lost** (bar chart): the number won and lost per month over the last 12 months, side by side, with the totals in its header.
3. **Three panels** side by side:
   - **Sales funnel:** for New, Qualified, Proposal, Negotiation and Won, the total value of deals at that stage or further along, as columns that step down. Lost deals are left out.
   - **Follow-ups:** activities with a follow-up that isn't done and is overdue or due in the next 7 days (today counts as due, not overdue). Overdue first, oldest first, then soonest. Each shows its description, the record it's on, linking to it, when it's due (overdue in Raspberry) and a checkbox to mark it done, which takes it off the list. With none, "Nothing due in the next 7 days."
   - **Recent activity:** the 10 newest timeline entries across the app, including automatic ones, each linking to its record. Logged ones start with their type ("Call:"), and each has a dot in its stage or status color. With none, "No activity yet."
