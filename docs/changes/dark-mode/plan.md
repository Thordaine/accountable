# Dark mode plan

**Goal:** a dark mode with a sun/moon toggle at the right of the top bar, remembered in the browser, as `docs/spec.md` describes it (App shell, Look and feel). Light mode stays the default and looks as it does today.

**How:** every color becomes a token in `frontend/src/styles/tokens.css`, with its light value on `:root` and its dark value on `:root[data-theme="dark"]`. The toggle sets `data-theme` on `<html>` and saves the choice in `localStorage`. A small inline script in `index.html` applies the saved choice before the first paint, so the page never flashes the other mode. Charts, dialogs, toasts and badges read the same tokens, so the whole app switches at once with no re-render and no reload.

**No new dependencies.** The sun and moon are two inline SVG icons, and CSS custom properties do the rest. Recharts accepts `var(--token)` as a fill or stroke.

**Read first:** `docs/changes/dark-mode/intent.md`, `docs/spec.md`, the brand skill (`.claude/skills/brand/SKILL.md`).

## Decision: AA wins in light mode

Light mode fails WCAG 2.2 AA today in a few places, which the new spec rule forbids. Measured against the current tokens:

| Pair | Ratio | Needs |
|---|---|---|
| Muted text `#5B7C87` on the page `#F0F4F5` | 4.05 | 4.5 |
| Muted text `#5B7C87` on white panels | 4.49 | 4.5 |
| White text on Cerulean badges and headers `#118AB2` | 3.96 | 4.5 |
| White text on Raspberry badges `#EF476F` | 3.62 | 4.5 |
| Sea ink `#05936E` text on white | 3.89 | 4.5 |
| Marigold ink `#9A6B00` on the email icon tint `#FFF3D9` | 4.26 | 4.5 |
| Checkbox border `#CDD8DB` on white | 1.45 | 3 |

Agreed in review: the AA rule wins over "looks exactly as today" for these pairs only, with the smallest change that passes: muted `#4E6E79` (4.95 on the page), a darker Cerulean fill for white text `#0E7A9E` (4.89), a darker Raspberry fill for white text `#D43D63` (4.52), sea ink `#047A5B` (5.33), Marigold ink `#8F6300` (4.83 on the email tint), and a Muted checkbox border (5.48). The brand colors themselves stay as they are for lines, dots and large fills. Everything else in light mode stays exactly as it is.

Added during the build, because the table above missed that Cerulean and Raspberry are also small text (links, "Show N more", Delete, late dates, required marks and form errors): Cerulean text `#0E789C` (4.53 on the page, 5.02 on white) and Raspberry text `#C43459` (4.60 on the late card). Each is its own token, `--ceru-ink` and `--rasp-ink`, beside the fills.

These are left out of the 3:1 rule, since text beside them carries the same meaning: the stage-colored segments of the pipeline band, timeline pips, the dashed "add" slot and table row lines. Text-field borders are left out too (Mist, 1.45 on white and 2.84 on black): every field has a label above it, and the focus ring, which meets 3:1, shows the field being typed in. Darkening them would change light mode beyond the agreed pairs.

## Files that change

**Tokens and styles**

- `frontend/src/styles/tokens.css`: dark values under `:root[data-theme="dark"]`, and `color-scheme: light` / `dark` so native date pickers, scrollbars and checkboxes follow. New tokens for every color that is written out today: text on each stage and status color (`--on-stage-new` … `--on-stage-lost`, `--on-status-*`, replacing the `DARK_STAGES` white-or-ink choice, since Won is Midnight with white text in light mode and Sea Mist with Midnight text in dark), row hover, card, late card, lifted card, input background, dialog backdrop, shadows, call and email icon tints, the pipeline band's expected part, the chart grid, tooltip and cursor.
- `frontend/src/styles/app.css`: every hex and `rgba()` replaced by a token; the toast's background and text from tokens; styles for the toggle button.

**Mode**

- `frontend/index.html`: an inline script in `<head>` that reads `localStorage["accountable-theme"]` and sets `data-theme="dark"` on `<html>` when it is `"dark"`.
- `frontend/src/lib/theme.ts` (new): `readTheme()`, `applyTheme(theme)` (sets the attribute and saves), and a `useTheme()` hook returning `[theme, toggle]`. The storage key lives here and in the inline script only.
- `frontend/src/components/ThemeToggle.tsx` (new): a button with `aria-label="Dark mode"` and `aria-pressed`, showing a moon in light mode and a sun in dark mode.
- `frontend/src/components/NavBar.tsx`: the toggle after Add deal.

**Components that write colors today**

- `frontend/src/lib/stages.ts`: `STAGE_TEXT` and `STATUS_TEXT` maps of `var(--on-…)`; `DARK_STAGES` goes.
- `frontend/src/components/Badge.tsx`, `frontend/src/pipeline/Column.tsx`, `frontend/src/dashboard/PipelineHero.tsx`: text colors from those maps; the band key's `#9DB1B7` becomes a token.
- `frontend/src/dashboard/charts.tsx`: the hex constants become `var(--…)` strings.
- `frontend/src/pages/Dashboard.tsx`: the Won legend dot uses `--stage-won` rather than `--ink`, so it matches the bars in both modes.

**Tests and docs**

- `frontend/src/lib/theme.test.ts`, `frontend/src/components/ThemeToggle.test.tsx`, `frontend/src/styles/contrast.test.ts` (new); `frontend/src/components/NavBar.test.tsx` (one more case).
- `e2e/theme.spec.ts` (new).
- `docs/STATUS.md`: a dark mode section. `docs/spec.md` already describes the change, including the AA rule, so it doesn't change.

## Order of work

Each phase ends with `npm run check:quick` passing.

**Phase 1: tokens, no visible change.** Move every literal color in `app.css`, `charts.tsx`, `PipelineHero.tsx`, `Badge.tsx` and `Column.tsx` into tokens with today's values, and replace `DARK_STAGES` with the `--on-*` tokens. Afterwards `grep -rnE "#[0-9a-fA-F]{3,6}\b|rgba?\(" frontend/src --include=*.tsx --include=*.ts --include=app.css` finds nothing outside tests. Existing unit and end-to-end tests stay green unchanged.

**Phase 2: contrast test, light mode.** Write `contrast.test.ts` with the light pairs; watch it fail on the pairs in the table above; change those light values as the decision above lists; watch it pass.

**Phase 3: the mode itself.** Write `theme.test.ts`; then `theme.ts` and the inline script in `index.html`. No dark values yet, so nothing visible changes.

**Phase 4: dark values.** Extend `contrast.test.ts` to dark mode and watch it fail (there are no dark values yet); add the dark values under `:root[data-theme="dark"]` from the brand skill: page `#04232E`, black panels, Sea Mist ink, a lightened muted (about `#8CA3AA`), lightened Sea Green and Marigold inks for text, Won as Sea Mist. Watch it pass.

**Phase 5: the toggle.** Write `ThemeToggle.test.tsx` and the NavBar case; then `ThemeToggle.tsx`, its styles and the NavBar change.

**Phase 6: end to end.** Write `e2e/theme.spec.ts` and run it; look at the dashboard, pipeline, a record page, a dialog, a toast and the date picker in dark mode in Chrome to catch anything the tokens missed; `npm run check`; update `docs/STATUS.md`.

The screenshots for the intent's third success criterion are taken in the Test step, after the build.

## Risks

- **A color missed in phase 1** shows as a light patch in dark mode. The grep in phase 1 and the look in phase 6 catch it. Third-party parts carry their own colors: sonner's toast background, Headless UI's dialog (styled by us already), and Recharts' default tooltip and cursor, which `charts.tsx` sets.
- **Flash of light mode on reload** if the inline script runs after the CSS paints. It sits in `<head>` before any stylesheet, and an end-to-end test checks the mode is set before React runs.
- **The storage key in two places** (the inline script and `theme.ts`). It's one string; the end-to-end reload test fails if they drift.
- **`localStorage` throws** in some private modes. Chrome is the only supported browser and allows it, so no guard (no defensive code).
- **Light mode drift** beyond the agreed pairs. The contrast test also checks that every other light token keeps its current value.
- **Recharts and `var()`**: SVG presentation attributes accept `var()` in Chrome. The end-to-end test reads a chart's computed stroke in both modes to prove it.

## Proof

**Unit tests (Vitest)**

`frontend/src/lib/theme.test.ts`
- With nothing stored, `readTheme()` is `"light"` and `<html>` has no `data-theme`.
- `applyTheme("dark")` sets `data-theme="dark"` on `<html>` and stores `"dark"`.
- `applyTheme("light")` removes the attribute and stores `"light"`.
- `useTheme()` starts from the stored value and `toggle` flips it.

`frontend/src/components/ThemeToggle.test.tsx`
- Renders a button named "Dark mode", not pressed, in light mode.
- A click presses it, sets dark mode on `<html>` and stores it; a second click returns to light.
- Starts pressed when dark is stored.

`frontend/src/components/NavBar.test.tsx`
- The "Dark mode" button comes after Add deal.

`frontend/src/styles/contrast.test.ts` (reads `tokens.css`, resolves `var()` references, computes WCAG ratios)
- In each mode, at least 4.5:1 for: ink and muted on the page and on panels; text on every stage and status color; the active tab and buttons; Sea Green and Marigold text inks on panels and on their tints.
- In each mode, at least 3:1 for: the focus ring on the page and on panels; the won and lost bars and the revenue line on panels; the checkbox border and its checked fill.
- Light tokens outside the agreed pairs keep today's values.

**End-to-end tests (Playwright)**, `e2e/theme.spec.ts`
- A first visit is light: the toggle isn't pressed, the page background is `#F0F4F5`.
- Clicking the toggle switches the page, a panel, a badge and the revenue chart's line to their dark values, and presses the toggle, with no reload.
- After a reload it is still dark, on the pipeline too.
- With the app's script blocked (routed to an empty file), a reload still shows the dark background: the inline script sets the mode before React runs.
- In dark mode, the Add deal dialog and a toast use the dark panel color.
- A new browser context starts light while the first one is dark.
- Toggling back to light and reloading stays light.

## Changes during build

Where the build departed from this plan:

- **Cerulean and Raspberry text colors**, added to the AA decision above.
- **Two more tokens:** `--on-sea` and `--midnight`, so button text and text on the light stage colors stay Midnight in dark mode. In light mode both equal today's ink.
- **`frontend/vite.config.ts`** also changes: `css: { include: [/tokens\.css/] }`, because Vitest otherwise hands tests an empty string for CSS files, even with `?raw`.
- **The "app script blocked" test** checks `data-theme="dark"` on `<html>` rather than the background, because in dev the CSS loads through `main.tsx`, so with that script blocked no background is drawn. It fails when the inline script is removed.
- **The chart tooltip** uses the raised surface rather than the panel, so it stands out on black panels. In light mode both are white.
- **The seed fix** (`backend/accountable/seed.py`, with a test in `backend/tests/test_seed.py`): seeded times are rounded down to the whole minute. Seeding moved any sample entry later than now back to the exact seed time, seconds included, while a stage change is stamped to the minute. So in the minute after seeding, a sample entry could sort above a new one, and the dashboard's "recent activity" end-to-end test failed. It isn't dark mode, but `npm run check` had to pass.
