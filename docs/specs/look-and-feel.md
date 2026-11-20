# Look and feel

Part of the spec; [`docs/spec.md`](../spec.md) has the summary and the index.

The brand skill (`.claude/skills/brand/SKILL.md`) sets fonts, colors, surfaces and tone, and takes priority over general design guidance.

- Instrument Sans for headings and body, JetBrains Mono for figures, money and dates in tables.
- Light mode: page background `#F0F4F5`, white rounded panels with no outline, Midnight ink.
- Dark mode: page background `#04232E`, black rounded panels with no outline, Sea Mist ink. Sea Green, Marigold, Cerulean and Raspberry text is lightened rather than darkened.
- Stages use the brand colors in order: New Sea Green, Qualified Marigold, Proposal Coral, Negotiation Cerulean. Won is Midnight (Sea Mist in dark mode) and Lost is Raspberry.
- Contact status: Lead Marigold, Qualified Cerulean, Customer Sea Green.
- The active tab is Midnight in light mode and Sea Mist in dark mode.
- Every color is a named token defined in one place, with a light and a dark value. Screens and charts use only the tokens.
- Both modes meet WCAG 2.2 AA contrast: at least 4.5:1 for normal text, and 3:1 for large text and for the parts that carry meaning, such as badges, chart lines and bars, checkboxes and focus rings. Text-field borders are the exception: each field has a label, and the focus ring shows the one being typed in.
- Money always shows its currency, such as "US$48,200", or "US$48k" and "US$1.2M" where space is short.
- Short, plain labels in sentence case, with no exclamation marks.
- The visual reference is mockup B, `docs/mockups/b-pipeline-river.html` (screenshot `b-pipeline-river.png`). Other screens follow its frame, panels, type and color: the top navigation bar, rounded panels on the page background, JetBrains Mono for figures and Midnight for the active tab. Mockups A and C were not chosen and are kept for the record only.
- The reference for dark mode is the screenshots of the dashboard and the pipeline in both modes, in `docs/changes/dark-mode/`.
