# Review policy

Every change is reviewed against this policy before it merges. The reviewer reports its findings and doesn't change any code.

## Passes

Make a separate pass over every change for each of these:

- **Bugs:** the code does what it's meant to, including when something goes wrong. Anything the server reads from outside, such as an id, a request body or a token's claims, may be missing, null or wrong: that gets a 4xx, never a 500. Check each one has a test.
- **Security:** no secrets or personal data are exposed, and nobody can do what they shouldn't.
- **Matches the spec and plan.md:** the change does what `docs/spec.md`, the area files in `docs/specs/` it touches and its own `docs/changes/<branch name>/plan.md` say, with nothing missing and nothing extra.
- **Described by the spec:** flag any behavior in the code that `docs/spec.md` and the area files don't describe, and any area file or index entry the change should have updated but didn't.
- **Follows STANDARDS.md:** the code and tests follow the coding standards in `docs/STANDARDS.md`.

## Important

An Important finding must be fixed before the change merges. A finding is Important if the change breaks behavior that should work, leaks data or breaks a rule in AGENTS.md.

## Nits

A nit is a small point, such as style or naming, that doesn't block the merge. Report at most five per review.