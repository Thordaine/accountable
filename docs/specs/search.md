# Search

Part of the spec; [`docs/spec.md`](../spec.md) has the summary and the index. The search boxes above the tables are in [records.md](records.md) and stay as they are.

- A search box in the top navigation bar, between the five sections and **Add deal**, with the placeholder "Search" and a search icon. Its label is "Search organizations, contacts and deals".
- Typing opens a dropdown of matches below it, updated as you type. It searches every organization, contact and deal on the server, not just those on screen.
- It matches names only, by any part of the name, ignoring case and treating every character literally. Spaces at either end are ignored, and an empty box closes the dropdown.
- Matches are grouped under Organizations, Contacts and Deals, in that order, with up to 5 of each, sorted by name. A group with no matches isn't shown.
- Contacts and deals show their organization as a hint, when they have one.
- With no matches at all, "No matches for "<text>"".
- Up and Down move through the matches, and the first is highlighted to start with. Enter, or a click, opens the highlighted match's page, then empties the box and closes the dropdown. Escape closes the dropdown, and so does a click outside it.
