# Improve the harness

Run this at Deploy, after the review fixes and before the merge.

1. Look at what went wrong on this change: the review's findings, what the person corrected and what the checks caught. The review and the corrections live in the session transcripts, not in the repo, so read them there; `git log main..HEAD --stat` shows which commits changed files their stage didn't plan for.
2. For a mistake that has happened twice, add the correction to AGENTS.md or docs/REVIEW.md, or suggest a change to docs/STANDARDS.md for the person to make. If a tool can catch it, add it to the checks instead. Compare with "Seen once" below, and move a mistake out of that list once it has a correction.
3. Add this change's other mistakes to "Seen once", one line each, so the next round can tell when one happens again.
4. Remove anything out of date, including numbers in the docs that drift, such as test counts.
5. Tell the person which review findings are still open, since they decide whether those are fixed before the merge.
6. Improve this file, so that the next round makes a better change. Keep this as the last step.

## Seen once

- The plan's contrast audit missed colors used as small text (Cerulean, Raspberry) and the text-field border (dark mode).
- An end-to-end test failed when the seed's times carried seconds and a live entry was stamped to the minute (dark mode).
- The stop hook's `check:quick` clashed with an `npm run check` still running in the background, because both Vitest runs want `frontend/coverage` (dark mode, Deploy).
- The API answered before the database had saved the change (MVP).
- A failed delete showed no message (MVP).
- A missing organization or contact id gave a server error instead of a 404 or 422 (MVP).
