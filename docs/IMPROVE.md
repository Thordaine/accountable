# Improve the harness

Run this at Deploy, after the review fixes and before the merge.

1. Look at what went wrong on this change: the review's findings, what the person corrected and what the checks caught. The review and the corrections live in the session transcripts, not in the repo, so read them there; `git log main..HEAD --stat` shows which commits changed files their stage didn't plan for.
   - The transcripts are `~/.claude/projects/<project path with / as ->/*.jsonl`; this change's are the ones dated from its first commit on. Start with only what the person typed, then read around the lines that look like corrections: `jq -r 'select(.type=="user") | .message.content | strings' <file>`. A summary at the top of a continued session lists the earlier errors and fixes.
2. For a mistake that has happened twice, add the correction to AGENTS.md or docs/REVIEW.md, or suggest a change to docs/STANDARDS.md for the person to make. If a tool can catch it, add it to the checks instead. Compare with "Seen once" below, matching by kind of mistake, not by wording, and move a mistake out of that list once it has a correction. Reproduce a repeat before fixing it, so the fix is for its cause.
3. Add this change's other mistakes to "Seen once", one line each, with the change and the stage, so the next round can tell when one happens again.
4. Remove anything out of date, including numbers in the docs that drift, such as test counts, and boxes in `STATUS.md` left unticked after their stage was done.
5. Tell the person which review findings are still open, since they decide whether those are fixed before the merge.
6. Improve this file, so that the next round makes a better change. Keep this as the last step.

## Seen once

- The plan's contrast audit missed colors used as small text (Cerulean, Raspberry) and the text-field border (dark mode).
- An end-to-end test failed when the seed's times carried seconds and a live entry was stamped to the minute (dark mode).
- The API answered before the database had saved the change (MVP).
- A failed delete showed no message (MVP).
- The backend let in any account on the Supabase project, relying on sign-ups being off there, and no doc said so (multi-user, review).
- `STATUS.md` ticked a step that `plan.md` still said was waiting for the person (multi-user, review).
- The spec said a person's display name is set in Supabase's dashboard, but its Add user dialog doesn't ask for one (multi-user).
- `render.yaml` had no region, so Render would have used Oregon, far from the database in Ireland (multi-user, Deploy).
- The plan assumed Headless UI behavior it hadn't checked: a `Menu` closes on click, and a `Combobox` resets its input when it closes (multi-user).
- Two stamps meant to be equal came from two clock calls microseconds apart (multi-user).
- Renumbering a pipeline column marked every deal in it as changed, not only the moved one (multi-user).
- A new label ("Search organizations, contacts and deals") broke end-to-end locators that matched names by substring (multi-user).
- ui-check found text wrapping or cut off in narrow cells (phone numbers, search hints) and the dark dialog blending into the page (multi-user, Test).
