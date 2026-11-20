# Records, tables and forms

Part of the spec; [`docs/spec.md`](../spec.md) has the summary and the index. What every record, table, form and delete shares. Each record's own fields, table, page and delete wording are in its area file: [organizations](organizations.md), [contacts](contacts.md), [deals](deals.md) and [activities](activities.md).

## Records

Every record has an id and the date and time it was created and last changed.

## Deleting

Deleting always asks first, in a dialog titled "Delete <name>?". Delete stays disabled while the linked records are counted. The confirmation says what happens to the linked records, with counts, as each record's area file sets out.

Counts include automatic entries. Deleting from a record's page goes back to its table.

## Tables (Organizations, Contacts, Deals)

Every table has:

- A search box above it. Search matches any text shown in the table, ignoring case and treating every character literally, and filters as you type. Empty cells show "—", and a late deal's close date includes "Late", so both can be searched for.
- Column headings that sort when clicked, toggling between ascending and descending. An arrow shows the sorted column, and the default sort is ascending.
- An **Add organization**, **Add contact** or **Add deal** button that opens the record's form in a dialog.
- Edit and Delete on each row. Edit opens the same form, filled in.
- Links on each row's name, organization and main contact, to their pages.
- A line under the table with the count of matching rows, such as "18 of 40 contacts".
- With no records, "No contacts yet." When the search matches nothing, an empty state with **Clear search**.

Every record is loaded at once and searching and sorting happen in the browser. With more than 150 rows, only the rows near the screen are drawn, so the browser's own find (Ctrl+F) doesn't see the rest; the search box covers every row.

Each table's columns and default sort are in its record's area file.

## Forms

- Forms open in a dialog, with Save and Cancel. Escape cancels.
- Required fields are marked, and Save shows "Required" next to each missing one instead of saving. Problems the server finds, such as an email that doesn't look like one, show next to their field. Any other failure shows "Couldn't save the deal".
- Organization and contact are picked from searchable lists that show up to 50 matches. Empty means none. Contacts show their organization as a hint.
- Saving closes the dialog, updates the screen and shows a short confirmation such as "Deal saved".

## Not found

An organization, contact or deal page that can't be loaded, such as one for a deleted record, says "Deal not found", "It may have been deleted, or the address is wrong.", and links back to its table.
