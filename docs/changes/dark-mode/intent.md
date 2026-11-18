# Intent: dark mode

## Problem

Accountable only has a light mode, and some people prefer a dark screen.

## Proposed outcome

A dark mode with a toggle on every page, across every section. The toggle is a sun/moon icon button at the right of the top navigation bar, beside Add deal, with an accessible label ("Dark mode") and a pressed state.

## Constraints

- Light mode stays the default, and the app remembers the choice in the browser's localStorage, with no backend change. Another browser starts in light mode, and `npm run seed` doesn't reset it.
- Light mode looks exactly as it does today, apart from the toggle.
- Colors stay in one place, as tokens, with no scattered overrides.
- Both modes meet WCAG 2.2 AA contrast: 4.5:1 for normal text, 3:1 for large text and for UI parts such as badges, chart lines and focus rings. spec.md gains this rule, since it states none today.
- Charts, dialogs and messages follow the mode too.
- No new dependencies unless the plan makes the case for one.

## Not in this change

- Following the device's own dark mode setting.
- A layout for phones.

## Success criteria

1. npm run check passes.
2. A new end-to-end test proves that the toggle works and is remembered after a reload.
3. Screenshots of the dashboard and the pipeline in both modes are saved in docs/changes/dark-mode/.
