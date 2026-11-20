# Activities and timelines

Part of the spec; [`docs/spec.md`](../spec.md) has the summary and the index. What every record and form shares is in [records.md](records.md). The stage moves that write automatic entries are in [deals.md](deals.md).

## Activity

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

## Timelines

- A contact's timeline shows the activities logged on the contact, plus those logged on any deal where they're the main contact.
- A deal's timeline shows the activities logged on the deal.
- Automatic entries are part of the timeline of the record they're about.
- Newest first, by "happened at".

## Deleting

The confirmation says "Delete this activity?", quoting its description.

## Timeline and logging an activity

- The log form has the type (Note, Call or Email, as buttons), the description, when it happened (defaults to the moment it's saved) and an optional follow-up date, and a **Log activity** button.
- Each entry shows its type as an icon (automatic entries have their own), the description, when it happened and, for one logged on a deal and shown on a contact, "On deal: <name>".
- An entry with a follow-up shows when it's due, as "Follow-up Today", "Follow-up 3 days overdue" or "Follow-up Tue 17 Nov", and a checkbox to mark it done. Overdue ones show in Raspberry. Done ones show the plain date.
- Activities have Edit and Delete. Automatic entries don't.
- With no entries, "Nothing logged yet."
