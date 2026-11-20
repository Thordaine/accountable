# Pipeline

Part of the spec; [`docs/spec.md`](../spec.md) has the summary and the index. The stage rules a move follows are in [deals.md](deals.md).

- One column per stage, in order: New, Qualified, Proposal, Negotiation, Won, Lost.
- Each card shows the deal's name, organization (if any), value and close date. A late card stands out in Raspberry with a "Late" badge. A click, or Enter, opens the deal's page.
- Drag a card, with the mouse or the keyboard, to another column to change its stage, or within a column to change its place. The card stays exactly where it's dropped, and its place is saved. Dropped on a column's empty space, it goes after the last card shown.
- Each column's header shows the stage, the number of deals, their total value and their expected revenue.
- Above the board: the total value and expected revenue of all open deals.
- All figures update as soon as a card is dropped, without waiting for the server. If the server refuses the move, the card goes back and "Couldn't move the deal" shows.
- Each column shows its first 40 cards, and a "Show N more" button shows 40 more. Its figures always cover every deal in it.
- Each column has an Add button that opens the deal form with that stage set. A new deal goes to the top of its column.
