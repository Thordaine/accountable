# Organizations

Part of the spec; [`docs/spec.md`](../spec.md) has the summary and the index. What every record, table and form shares is in [records.md](records.md).

## Organization

A company we do business with. It has many contacts and many deals.

| Field | Rules |
|---|---|
| Name | Required |
| Website | Optional |
| Industry | Optional, free text |
| Notes | Optional, several lines |

## Deleting

The confirmation says: "Its 4 contacts and 3 deals will be kept, with no organization."

## Organizations table

| Table | Columns | Default sort |
|---|---|---|
| Organizations | Name, Industry, Website, Contacts (count), Open deals (value) | Name |

## Organization page

- The organization's details, with Edit and Delete. The website opens in a new tab.
- Who added it and who last changed it, as [records.md](records.md) sets out.
- Its contacts, as a short table of name, job title and status linking to each contact, with Add contact (organization filled in).
- Its deals, as a short table of name, stage, value and close date linking to each deal, with Add deal (organization filled in), and the total value of its open deals, "US$X in open deals".
