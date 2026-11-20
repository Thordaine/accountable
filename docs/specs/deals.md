# Deals

Part of the spec; [`docs/spec.md`](../spec.md) has the summary and the index. What every record, table and form shares is in [records.md](records.md). Timelines are in [activities.md](activities.md) and the board in [pipeline.md](pipeline.md).

## Deal

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

## Stages and probability

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

## Deleting

The confirmation says: "Its 5 activities will be deleted."

## Deals table

| Table | Columns | Default sort |
|---|---|---|
| Deals | Name, Organization, Main contact, Stage, Value, Probability, Close date | Close date |

In the Deals table, a late deal's close date shows in Raspberry with a "Late" badge, and Stage sorts in pipeline order.

## Deal page

- The deal's details: stage, value, probability, expected revenue, close date, organization and main contact (each linking to its page), with Edit and Delete. A late deal has a "Late" badge and says "This deal is past its close date."
- A stage selector, which follows the stage rules above. A deal moved this way goes to the top of its new column.
- Its timeline, with a form at the top to log an activity.
