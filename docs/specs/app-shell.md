# App shell

Part of the spec; [`docs/spec.md`](../spec.md) has the summary and the index. Signing in is in [sign-in.md](sign-in.md) and the search box in [search.md](search.md).

- One page app with five sections: Dashboard, Organizations, Contacts, Deals and Pipeline. The dashboard is the landing page.
- A top navigation bar, always visible while signed in: the Accountable mark and name, the five sections with the open one highlighted, the search box, an **Add deal** button that opens the deal form from anywhere and, at the far right beside it, the user menu.
- Each section has its own address, and so does each record's page (for example `/deals/12`), so the browser's back button, refresh and bookmarks work.
- Designed for laptop and desktop screens from 1280 pixels wide. The content is at most 1360 pixels wide.
- Fonts and libraries are bundled with the app, never loaded from the internet.
- Dates and times show in the browser's time zone, and "today" is today there: late deals, follow-ups due, the dashboard's date and the close date of a deal won today. People in different time zones each see their own.
- Your own changes show on every screen as soon as the server confirms it. Other people's changes show when you open a screen or come back to the browser tab; there are no live updates. When two people change the same record, the last save wins.
- Short confirmations ("Deal saved", "Activity logged", "Moved to Won", "Contact deleted") appear at the bottom right.

## User menu

- A round button showing your initials, labelled "Account menu for <name>". A click, or Enter, opens the menu below it.
- The menu shows your name and email at the top, then **Theme** with three choices, Light, Dark and System, the current one checked, then **Sign out**.
- Up and Down move through the choices. Escape closes the menu, and so does a click outside it. Picking a theme applies it at once and leaves the menu open; Sign out signs you out.

## Theme

- Light, Dark or System. Light is the default. System follows the device's light or dark setting, and switches when the device does, with no reload.
- The whole app switches at once, including charts, dialogs, forms, menus and confirmations, with no reload.
- The browser remembers the choice, not the person, so it is kept after a refresh, a restart and signing out, and the page opens in it without first flashing the other mode. Another browser starts in Light, and `npm run seed` doesn't change it.
