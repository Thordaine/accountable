# Spec: the Accountable MVP

What the MVP does, screen by screen. `docs/intent.md` says why; `docs/TECH_STACK.md` says what it's built with.

## App shell

- One page app with five sections: Dashboard, Organizations, Contacts, Deals and Pipeline. The dashboard is the landing page.
- A top navigation bar, always visible: the Accountable name, the five sections with the open one highlighted, and an **Add deal** button that opens the deal form from anywhere.
- Each section has its own address, and so does each record's page (for example `/deals/12`), so the browser's back button, refresh and bookmarks work.
- Light mode only, designed for laptop and desktop screens from 1280 pixels wide.
- It works fully offline: fonts and libraries are bundled with the app, never loaded from the internet.

## Records

Every record has an id and the date and time it was created and last changed.

### Organization

| Field | Rules |
|---|---|
| Name | Required |
| Website | Optional |
| Industry | Optional, free text |
| Notes | Optional, several lines |

### Contact

| Field | Rules |
|---|---|
| Name | Required |
| Email | Optional, must look like an email address |
| Phone | Optional |
| Job title | Optional |
| Organization | Optional, one organization |
| Status | Required: Lead, Qualified or Customer. New contacts start as Lead |

### Deal

| Field | Rules |
|---|---|
| Name | Required |
| Organization | Optional, one organization |
| Main contact | Optional, one contact |
| Stage | Required: New, Qualified, Proposal, Negotiation, Won or Lost |
| Value | Required, US dollars, zero or more, whole dollars |
| Probability of close | Required, 0 to 100 percent. Set from the stage unless changed by hand |
| Close date | Required: the expected close date while open, the actual one once Won or Lost. New deals default to 30 days from today |
| Position | The card's place in its pipeline column |

A deal is **open** when its stage is New, Qualified, Proposal or Negotiation, and **late** when it's open and its close date is before today.

### Activity

| Field | Rules |
|---|---|
| Type | Required: Note, Call or Email |
| Related to | Exactly one contact or one deal: the record it was logged on |
| Description | Required, several lines |
| Happened at | Required date and time, defaults to now |
| Follow-up date | Optional |
| Done | Only for activities with a follow-up date. Starts as not done |

**Automatic entries** are timeline entries the app writes by itself: "Moved from Proposal to Negotiation" when a deal changes stage, and "Status changed from Lead to Customer" when winning a deal changes a contact's status. They have no follow-up, and can't be edited or deleted.

## Rules

### Stages and probability

| Stage | Usual probability |
|---|---|
| New | 10% |
| Qualified | 25% |
| Proposal | 50% |
| Negotiation | 75% |
| Won | 100% |
| Lost | 0% |

When a deal changes stage, by dragging on the pipeline or by editing it:

1. Its probability becomes the new stage's usual probability, even if it was set by hand.
2. An automatic entry "Moved from <old stage> to <new stage>" is added to its timeline.
3. If the new stage is Won or Lost, its close date becomes today. It can be edited afterwards.
4. If the new stage is Won and it has a main contact who isn't a customer, the contact's status becomes Customer, with an automatic entry on the contact's timeline.

A Won or Lost deal can be moved back to any stage, following the same rules.

A probability changed by hand without a change of stage is kept.

**Expected revenue** of a deal is its value times its probability of close.

### Timelines

- A contact's timeline shows the activities logged on the contact, plus those logged on any deal where they're the main contact.
- A deal's timeline shows the activities logged on the deal.
- Automatic entries are part of the timeline of the record they're about.
- Newest first, by "happened at".

### Deleting

Deleting always asks first. The confirmation names the record and says what happens to its linked records, with counts:

- **Organization:** "Its 4 contacts and 3 deals will be kept, with no organization."
- **Contact:** "Their 2 deals will be kept, with no main contact. Their 6 activities will be deleted."
- **Deal:** "Its 5 activities will be deleted."
- **Activity:** no linked records.

## Screens

### Tables (Organizations, Contacts, Deals)

Every table has:

- A search box above it. Search matches any text shown in the table, ignoring case, and filters as you type.
- Column headings that sort when clicked: first click ascending, second click descending. An arrow shows the sorted column.
- An **Add** button that opens the record's form in a dialog.
- Edit and Delete on each row. Edit opens the same form, filled in.
- A click on a row's name opens the record's page.
- A line under the table with the count, such as "18 of 40 contacts".
- An empty state when nothing matches, with a way to clear the search.

Every record is loaded at once and searching and sorting happen in the browser, which is plenty quick for up to 1,000 records of each kind.

| Table | Columns | Default sort |
|---|---|---|
| Organizations | Name, Industry, Website, Contacts (count), Open deals (value) | Name |
| Contacts | Name, Organization, Job title, Email, Phone, Status | Name |
| Deals | Name, Organization, Main contact, Stage, Value, Probability, Close date | Close date |

The Contacts table has a status filter above it: All, Lead, Qualified, Customer.

In the Deals table, a late deal's close date shows in Raspberry with a "Late" badge.

### Forms

- Forms open in a dialog, with Save and Cancel. Escape cancels.
- Required fields are marked, and Save shows what's missing next to each field instead of saving.
- Organization and contact are picked from searchable lists.
- Saving closes the dialog, updates the screen and shows a short confirmation such as "Deal saved".

### Organization page

- The organization's details, with Edit and Delete.
- Its contacts, as a short table linking to each contact, with Add contact (organization filled in).
- Its deals, as a short table linking to each deal, with Add deal (organization filled in), and the total value of its open deals.

### Contact page

- The contact's details and status, with Edit and Delete, and a link to their organization.
- The deals where they're the main contact, linking to each.
- Their timeline, with a form at the top to log an activity.

### Deal page

- The deal's details: stage, value, probability, expected revenue, close date, organization and main contact (each linking to its page), with Edit and Delete. A late deal says so.
- A stage selector, which follows the stage rules above.
- Its timeline, with a form at the top to log an activity.

### Timeline and logging an activity

- The log form has the type (Note, Call or Email), the description, when it happened (defaults to now) and an optional follow-up date.
- Each entry shows its type as an icon, the description, when it happened and, for one logged on a deal and shown on a contact, which deal it's about.
- An entry with a follow-up shows its date and a checkbox to mark it done. Overdue ones show in Raspberry.
- Activities have Edit and Delete. Automatic entries don't.

### Pipeline

- One column per stage, in order: New, Qualified, Proposal, Negotiation, Won, Lost.
- Each card shows the deal's name, organization, value and close date. A late card stands out in Raspberry with a "Late" badge. A click opens the deal's page.
- Drag a card to another column to change its stage, or within a column to change its place. The card stays exactly where it's dropped, and its place is saved.
- Each column's header shows the stage, the number of deals, their total value and their expected revenue.
- Above the board: the total value and expected revenue of all open deals.
- All figures update as soon as a card is dropped, without waiting for the server.
- Each column has an Add button that opens the deal form with that stage set. A new deal goes to the top of its column.

### Dashboard

All figures come from the data. Money is in US dollars, and "last 12 months" means the current month and the 11 before it.

The layout follows mockup B, top to bottom:

1. **Open pipeline**, full width. The open pipeline's total value, large, with the expected revenue, the number of open deals (and how many are late) and the win rate in the last 12 months beside it. Below, a band split into the four open stages, each as wide as its share of the value, showing its value, number of deals and expected revenue, with the expected revenue shaded inside it. Each stage links to the Pipeline board. Win rate is deals won divided by deals won or lost, by close date.
2. **Two charts** side by side:
   - **Revenue won** (line chart): per month over the last 12 months, with the 12 months' total in its header.
   - **Deals won and lost** (bar chart): the number won and lost per month over the last 12 months, side by side, with the totals in its header.
3. **Three panels** side by side:
   - **Sales funnel:** for New, Qualified, Proposal, Negotiation and Won, the total value of deals at that stage or further along, as columns that step down. Lost deals are left out.
   - **Follow-ups:** activities with a follow-up that isn't done and is overdue or due in the next 7 days. Overdue first, then soonest. Each shows the record it's on, linking to it, when it's due (overdue in Raspberry) and a checkbox to mark it done.
   - **Recent activity:** the 10 newest timeline entries across the app, including automatic ones, each linking to its record.

Marking a follow-up done, or any change elsewhere, shows on the dashboard the next time it's opened.

## Look and feel

The brand skill (`.claude/skills/brand/SKILL.md`) sets fonts, colors, surfaces and tone, and takes priority over general design guidance.

- Instrument Sans for headings and body, JetBrains Mono for figures, money and dates in tables.
- Page background `#F0F4F5`, white rounded panels with no outline.
- Stages use the brand colors in order: New Sea Green, Qualified Marigold, Proposal Coral, Negotiation Cerulean. Won is Midnight and Lost is Raspberry.
- Contact status: Lead Marigold, Qualified Cerulean, Customer Sea Green.
- Money always shows its currency, such as "US$48,200", or "US$48k" where space is short.
- Short, plain labels in sentence case.
- The visual reference is mockup B, `docs/mockups/b-pipeline-river.html` (screenshot `b-pipeline-river.png`). Other screens follow its frame, panels, type and color: the top navigation bar, white rounded panels on the page background, JetBrains Mono for figures and Midnight for the active tab. Mockups A and C were not chosen and are kept for the record only.

## Sample data

`npm run seed` replaces all data with the sample data, and a new database gets it by itself.

- About 15 organizations across several industries, 40 contacts at every status, 50 deals and 80 activities.
- Deals: about 16 open across the four open stages, 25 won and 9 lost, so every month in the last 12 has between 0 and 4 deals won.
- Dates are relative to the day it's seeded, so it always looks current: deals won and lost spread over the past 12 months, open deals closing over the coming months, three or four deals late, and follow-ups both overdue and due in the next few days.
- Names, companies and descriptions are realistic and plausible, not lorem ipsum.

## Out of scope

As in `docs/intent.md`: sign-in and several users, dark mode, phone layouts, AI, integrations, other currencies, extra reports, tags and custom fields, editable stages, and import or export.
