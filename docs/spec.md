# Spec: Accountable

What Accountable does today, screen by screen. This is the description of the product: every change that alters what it does updates this file. `docs/TECH_STACK.md` says what it's built with.

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

## App shell

- One page app with five sections: Dashboard, Organizations, Contacts, Deals and Pipeline. The dashboard is the landing page.
- A top navigation bar, always visible: the Accountable mark and name, the five sections with the open one highlighted, an **Add deal** button that opens the deal form from anywhere and, at the far right beside it, the dark mode toggle.
- Each section has its own address, and so does each record's page (for example `/deals/12`), so the browser's back button, refresh and bookmarks work.
- Designed for laptop and desktop screens from 1280 pixels wide. The content is at most 1360 pixels wide.
- Light mode and dark mode. Light mode is the default. The toggle is a sun/moon icon button labelled "Dark mode", shown as pressed while dark mode is on. The whole app switches at once, including charts, dialogs, forms, menus and confirmations, with no reload.
- The browser remembers the chosen mode, so it is kept after a refresh and a restart, and the page opens in it without first flashing the other mode. Another browser starts in light mode, and `npm run seed` doesn't change it.
- It works fully offline: fonts and libraries are bundled with the app, never loaded from the internet.
- Any change made anywhere shows on every screen as soon as the server confirms it.
- Short confirmations ("Deal saved", "Activity logged", "Moved to Won", "Contact deleted") appear at the bottom right.

## Records

Every record has an id and the date and time it was created and last changed.

### Organization

A company we do business with. It has many contacts and many deals.

| Field | Rules |
|---|---|
| Name | Required |
| Website | Optional |
| Industry | Optional, free text |
| Notes | Optional, several lines |

### Contact

A person we deal with. A lead is a contact with the Lead status, so there's no separate list of leads.

| Field | Rules |
|---|---|
| Name | Required |
| Email | Optional, must look like an email address |
| Phone | Optional |
| Job title | Optional |
| Organization | Optional, one organization |
| Status | Required: Lead, Qualified or Customer. New contacts start as Lead |

### Deal

A potential sale.

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

A deal is **open** when its stage is New, Qualified, Proposal or Negotiation, and **late** when it's open and its close date is before today. A deal closing today isn't late.

### Activity

Something that happened, or needs to happen, with a contact or deal.

| Field | Rules |
|---|---|
| Type | Required: Note, Call or Email |
| Related to | Exactly one contact or one deal: the record it was logged on |
| Description | Required, several lines |
| Happened at | Required date and time, defaults to now |
| Follow-up date | Optional |
| Done | Whether the follow-up is done. Starts as not done |

**Automatic entries** are timeline entries the app writes by itself: "Moved from Proposal to Negotiation" when a deal changes stage, and "Status changed from Lead to Customer" when winning a deal changes a contact's status. They have no follow-up and can't be edited or deleted on their own. Deleting their deal or contact deletes them too.

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

When a deal changes stage, by dragging on the pipeline, with the deal page's stage selector or by editing it:

1. Its probability becomes the new stage's usual probability, even if it was set by hand.
2. An automatic entry "Moved from <old stage> to <new stage>" is added to its timeline.
3. If the new stage is Won or Lost, its close date becomes today. It can be edited afterwards.
4. If the new stage is Won and it has a main contact who isn't a customer, the contact's status becomes Customer, with an automatic entry on the contact's timeline.

Moving a deal to the stage it's already in changes nothing and writes no entry. A Won or Lost deal can be moved back to any stage, following the same rules. A probability or close date changed by hand without a change of stage is kept. Changing a contact's status by hand writes no entry.

In the deal form, picking a stage fills in its usual probability, and Won or Lost fills in today as the close date.

**Expected revenue** of a deal is its value times its probability of close. It's rounded only when shown.

### Timelines

- A contact's timeline shows the activities logged on the contact, plus those logged on any deal where they're the main contact.
- A deal's timeline shows the activities logged on the deal.
- Automatic entries are part of the timeline of the record they're about.
- Newest first, by "happened at".

### Deleting

Deleting always asks first, in a dialog titled "Delete <name>?". Delete stays disabled while the linked records are counted. The confirmation says what happens to the linked records, with counts:

- **Organization:** "Its 4 contacts and 3 deals will be kept, with no organization."
- **Contact:** "Their 2 deals will be kept, with no main contact. Their 6 activities will be deleted."
- **Deal:** "Its 5 activities will be deleted."
- **Activity:** "Delete this activity?", quoting its description.

Counts include automatic entries. Deleting from a record's page goes back to its table.

## Screens

### Tables (Organizations, Contacts, Deals)

Every table has:

- A search box above it. Search matches any text shown in the table, ignoring case and treating every character literally, and filters as you type. Empty cells show "—", and a late deal's close date includes "Late", so both can be searched for.
- Column headings that sort when clicked, toggling between ascending and descending. An arrow shows the sorted column, and the default sort is ascending.
- An **Add organization**, **Add contact** or **Add deal** button that opens the record's form in a dialog.
- Edit and Delete on each row. Edit opens the same form, filled in.
- Links on each row's name, organization and main contact, to their pages.
- A line under the table with the count of matching rows, such as "18 of 40 contacts".
- With no records, "No contacts yet." When the search matches nothing, an empty state with **Clear search**.

Every record is loaded at once and searching and sorting happen in the browser. With more than 150 rows, only the rows near the screen are drawn, so the browser's own find (Ctrl+F) doesn't see the rest; the search box covers every row.

| Table | Columns | Default sort |
|---|---|---|
| Organizations | Name, Industry, Website, Contacts (count), Open deals (value) | Name |
| Contacts | Name, Organization, Job title, Email, Phone, Status | Name |
| Deals | Name, Organization, Main contact, Stage, Value, Probability, Close date | Close date |

The Contacts table has a status filter above it: All, Lead, Qualified, Customer. The count line counts within the filtered contacts.

In the Deals table, a late deal's close date shows in Raspberry with a "Late" badge, and Stage sorts in pipeline order.

### Forms

- Forms open in a dialog, with Save and Cancel. Escape cancels.
- Required fields are marked, and Save shows "Required" next to each missing one instead of saving. Problems the server finds, such as an email that doesn't look like one, show next to their field. Any other failure shows "Couldn't save the deal".
- Organization and contact are picked from searchable lists that show up to 50 matches. Empty means none. Contacts show their organization as a hint.
- Saving closes the dialog, updates the screen and shows a short confirmation such as "Deal saved".

### Organization page

- The organization's details, with Edit and Delete. The website opens in a new tab.
- Its contacts, as a short table of name, job title and status linking to each contact, with Add contact (organization filled in).
- Its deals, as a short table of name, stage, value and close date linking to each deal, with Add deal (organization filled in), and the total value of its open deals, "US$X in open deals".

### Contact page

- The contact's details and status, with Edit and Delete, a link to their organization and their email as a mail link.
- The deals where they're the main contact, linking to each.
- Their timeline, with a form at the top to log an activity.

### Deal page

- The deal's details: stage, value, probability, expected revenue, close date, organization and main contact (each linking to its page), with Edit and Delete. A late deal has a "Late" badge and says "This deal is past its close date."
- A stage selector, which follows the stage rules above. A deal moved this way goes to the top of its new column.
- Its timeline, with a form at the top to log an activity.

### Not found

An organization, contact or deal page that can't be loaded, such as one for a deleted record, says "Deal not found", "It may have been deleted, or the address is wrong.", and links back to its table.

### Timeline and logging an activity

- The log form has the type (Note, Call or Email, as buttons), the description, when it happened (defaults to the moment it's saved) and an optional follow-up date, and a **Log activity** button.
- Each entry shows its type as an icon (automatic entries have their own), the description, when it happened and, for one logged on a deal and shown on a contact, "On deal: <name>".
- An entry with a follow-up shows when it's due, as "Follow-up Today", "Follow-up 3 days overdue" or "Follow-up Tue 17 Nov", and a checkbox to mark it done. Overdue ones show in Raspberry. Done ones show the plain date.
- Activities have Edit and Delete. Automatic entries don't.
- With no entries, "Nothing logged yet."

### Pipeline

- One column per stage, in order: New, Qualified, Proposal, Negotiation, Won, Lost.
- Each card shows the deal's name, organization (if any), value and close date. A late card stands out in Raspberry with a "Late" badge. A click, or Enter, opens the deal's page.
- Drag a card, with the mouse or the keyboard, to another column to change its stage, or within a column to change its place. The card stays exactly where it's dropped, and its place is saved. Dropped on a column's empty space, it goes after the last card shown.
- Each column's header shows the stage, the number of deals, their total value and their expected revenue.
- Above the board: the total value and expected revenue of all open deals.
- All figures update as soon as a card is dropped, without waiting for the server. If the server refuses the move, the card goes back and "Couldn't move the deal" shows.
- Each column shows its first 40 cards, and a "Show N more" button shows 40 more. Its figures always cover every deal in it.
- Each column has an Add button that opens the deal form with that stage set. A new deal goes to the top of its column.

### Dashboard

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

## Look and feel

The brand skill (`.claude/skills/brand/SKILL.md`) sets fonts, colors, surfaces and tone, and takes priority over general design guidance.

- Instrument Sans for headings and body, JetBrains Mono for figures, money and dates in tables.
- Light mode: page background `#F0F4F5`, white rounded panels with no outline, Midnight ink.
- Dark mode: page background `#04232E`, black rounded panels with no outline, Sea Mist ink. Sea Green and Marigold text is lightened rather than darkened.
- Stages use the brand colors in order: New Sea Green, Qualified Marigold, Proposal Coral, Negotiation Cerulean. Won is Midnight (Sea Mist in dark mode) and Lost is Raspberry.
- Contact status: Lead Marigold, Qualified Cerulean, Customer Sea Green.
- The active tab is Midnight in light mode and Sea Mist in dark mode.
- Every color is a named token defined in one place, with a light and a dark value. Screens and charts use only the tokens.
- Both modes meet WCAG 2.2 AA contrast: at least 4.5:1 for normal text, and 3:1 for large text and for the parts that carry meaning, such as badges, chart lines and bars, checkboxes and focus rings.
- Money always shows its currency, such as "US$48,200", or "US$48k" and "US$1.2M" where space is short.
- Short, plain labels in sentence case, with no exclamation marks.
- The visual reference is mockup B, `docs/mockups/b-pipeline-river.html` (screenshot `b-pipeline-river.png`). Other screens follow its frame, panels, type and color: the top navigation bar, rounded panels on the page background, JetBrains Mono for figures and Midnight for the active tab. Mockups A and C were not chosen and are kept for the record only.
- The reference for dark mode is the screenshots of the dashboard and the pipeline in both modes, in `docs/changes/dark-mode/`.

## Data and sample data

The data lives in one SQLite file, `data/accountable.db`, or the file named by `ACCOUNTABLE_DB`. A new database gets the sample data by itself. `npm run seed` replaces all data with the sample data, and so does starting with `ACCOUNTABLE_RESET=1`.

- 15 organizations across several industries, 40 contacts at every status, 50 deals and 80 logged activities, plus the automatic entries for the deals' stage moves and the contacts who became customers.
- Deals: 16 open across the four open stages, 25 won and 9 lost, so every month in the last 12 has between 0 and 4 deals won.
- Dates are relative to the day it's seeded, so it always looks current: deals won and lost spread over the past 12 months, open deals closing over the coming months, three of them late, and follow-ups overdue, due in the next few days, due later and done.
- Names, companies and descriptions are realistic and plausible, not lorem ipsum.

## Not built

Sign-in, user accounts and several users; following the device's own dark mode setting; phone layouts; AI features; email, calendar or phone integrations; currencies other than US dollars; reports beyond the dashboard; tags and custom fields; changing the pipeline stages; importing and exporting data; making Accountable available beyond the computer it runs on.
