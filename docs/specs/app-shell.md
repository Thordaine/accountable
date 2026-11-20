# App shell

Part of the spec; [`docs/spec.md`](../spec.md) has the summary and the index.

- One page app with five sections: Dashboard, Organizations, Contacts, Deals and Pipeline. The dashboard is the landing page.
- A top navigation bar, always visible: the Accountable mark and name, the five sections with the open one highlighted, an **Add deal** button that opens the deal form from anywhere and, at the far right beside it, the dark mode toggle.
- Each section has its own address, and so does each record's page (for example `/deals/12`), so the browser's back button, refresh and bookmarks work.
- Designed for laptop and desktop screens from 1280 pixels wide. The content is at most 1360 pixels wide.
- Light mode and dark mode. Light mode is the default. The toggle is a sun/moon icon button labelled "Dark mode", shown as pressed while dark mode is on. The whole app switches at once, including charts, dialogs, forms, menus and confirmations, with no reload.
- The browser remembers the chosen mode, so it is kept after a refresh and a restart, and the page opens in it without first flashing the other mode. Another browser starts in light mode, and `npm run seed` doesn't change it.
- It works fully offline: fonts and libraries are bundled with the app, never loaded from the internet.
- Any change made anywhere shows on every screen as soon as the server confirms it.
- Short confirmations ("Deal saved", "Activity logged", "Moved to Won", "Contact deleted") appear at the bottom right.
