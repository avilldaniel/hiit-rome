# 11 — Library and Samples

**What to build:** A built-in, read-only Library of about 10 Samples covering beginner, intermediate and advanced levels across HIIT, Tabata, Circuit and EMOM, plus at least two hand-built Samples using named nested Groups. The trainer can preview a Sample, start it directly, or add a copy to My Workouts.

**Human checkpoint:** the Sample content must be reviewed and approved by the user before release. Draft it, then flag it for review.

Reference: spec "Library", "Library and Samples" stories.

**Blocked by:** 05 — My Workouts: storage and home

**Status:** ready-for-agent

- [ ] About 10 Samples bundled as static data, each valid against the Workout model. A test validates every Sample and checks that its Timeline total matches its stated duration.
- [ ] Library screen reachable from home, listing Samples with name, level, style and total duration.
- [ ] Sample preview shows the outline and total; Start runs it without copying; "Add to my Workouts" copies it with a fresh id.
- [ ] The Library is never modified by user actions.
- [ ] The Sample list is presented to the user for review; the ticket notes their approval or the requested changes.
