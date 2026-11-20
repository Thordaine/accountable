# Contacts

Part of the spec; [`docs/spec.md`](../spec.md) has the summary and the index. What every record, table and form shares is in [records.md](records.md). Timelines are in [activities.md](activities.md).

## Contact

A person we deal with. A lead is a contact with the Lead status, so there's no separate list of leads.

| Field | Rules |
|---|---|
| Name | Required |
| Email | Optional, must look like an email address |
| Phone | Optional |
| Job title | Optional |
| Organization | Optional, one organization |
| Status | Required: Lead, Qualified or Customer. New contacts start as Lead |

Winning a deal can change its main contact's status, as the stage rules in [deals.md](deals.md) set out.

## Deleting

The confirmation says: "Their 2 deals will be kept, with no main contact. Their 6 activities will be deleted."

## Contacts table

| Table | Columns | Default sort |
|---|---|---|
| Contacts | Name, Organization, Job title, Email, Phone, Status | Name |

The Contacts table has a status filter above it: All, Lead, Qualified, Customer. The count line counts within the filtered contacts.

## Contact page

- The contact's details and status, with Edit and Delete, a link to their organization and their email as a mail link.
- The deals where they're the main contact, linking to each.
- Their timeline, with a form at the top to log an activity.
