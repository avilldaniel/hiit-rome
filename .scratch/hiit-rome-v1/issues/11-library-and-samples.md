# 11 — Library and Samples

**What to build:** A built-in, read-only Library of about 10 Samples covering beginner, intermediate and advanced levels across HIIT, Tabata, Circuit and EMOM, plus at least two hand-built Samples using named nested Groups. The trainer can preview a Sample, start it directly, or add a copy to My Workouts.

**Human checkpoint:** the Sample content must be reviewed and approved by the user before release. Draft it, then flag it for review.

Reference: spec "Library", "Library and Samples" stories.

**Blocked by:** 05 — My Workouts: storage and home

**Status:** ready-for-human (code done on branch v1; only the user's review of the Sample content remains)

- [x] About 10 Samples bundled as static data, each valid against the Workout model. A test validates every Sample and checks that its Timeline total matches its stated duration.
- [x] Library screen reachable from home, listing Samples with name, level, style and total duration.
- [x] Sample preview shows the outline and total; Start runs it without copying; "Add to my Workouts" copies it with a fresh id.
- [x] The Library is never modified by user actions.
- [ ] The Sample list is presented to the user for review; the ticket notes their approval or the requested changes.

## Comments

**Agent (implementation):** Code is done and tested: a unit test per Sample checks it against the Workout model, the nesting limit and its stated duration through the Timeline, and Playwright covers Library → preview → Start, and Add → edit the copy → Sample unchanged. Decisions worth a look:
- **Samples start as they are** at `/session/sample-<slug>`: the Session screen falls back to the Library when no stored Workout has that id. A Sample's Session is saved and offered back after a reload like any other, but it is never marked as used.
- **"Add to My Workouts"** stays on the preview and confirms with an "Edit your copy" link, so several Samples can be added in a row. The copy keeps the Sample's name.
- **Read-only:** Samples are deep-frozen and never stored; a copy gets fresh ids throughout.
- The Library groups Samples by level, and each card adds a one-line blurb and the Interval color strip, as on the home cards.
- GLOSSARY "Sample" now says a Sample can be started as it is, as well as copied.

**Samples for review** (11; Lead-in 0:10 each, not counted in the totals):

| Sample | Level | Style | Total | Structure |
| --- | --- | --- | --- | --- |
| First Steps HIIT | Beginner | HIIT | 13:30 | Warm-up 3:00 · [Bodyweight Squats 0:30, Rest 0:30, Knee Push-ups 0:30, Rest 0:30] × 4 · Cool-down 3:00 |
| Low-Impact Tabata | Beginner | Tabata | 8:50 | Warm-up 3:00 · [Step Jacks 0:20, Rest 0:10] × 8 · Cool-down 2:00 |
| Bodyweight Circuit | Beginner | Circuit | 19:00 | Warm-up 3:00 · [Squats, Knee Push-ups, Glute Bridges, Plank: 0:40 each, Rest 0:20 between, Round rest 1:00] × 3 · Cool-down 3:00 |
| EMOM Starter | Beginner | EMOM | 15:00 | Warm-up 3:00 · [10 Air Squats 1:00, 10 Sit-ups 1:00] × 5 · Cool-down 2:00 |
| Classic 40/20 | Intermediate | HIIT | 17:40 | Warm-up 5:00 · [Burpees 0:40, Rest 0:20, Mountain Climbers 0:40, Rest 0:20] × 5 · Cool-down 3:00 |
| Double Tabata | Intermediate | Tabata | 15:40 | Warm-up 4:00 · "Tabata" × 2 [[Squat Jumps 0:20, Rest 0:10] × 8, Between Tabatas 1:00] · Cool-down 3:00 |
| Full-Body Circuit | Intermediate | Circuit | 25:15 | Warm-up 5:00 · [Push-ups, Reverse Lunges, Pike Push-ups, Jump Squats, Plank Shoulder Taps: 0:45 each, Rest 0:15 between, Round rest 1:00] × 3 · Cool-down 4:00 |
| Sprint Repeats | Advanced | HIIT | 24:30 | Warm-up 5:00 · "Sprint Round" × 3 ["Sprints" [Sprint 0:30, Walk 0:30] × 4, Recover 2:00] · Cool-down 5:00 |
| Burpee & Climber Tabatas | Advanced | Tabata | 27:20 | Warm-up 5:00 · "Tabata Pair" × 2 ["Burpee Tabata" [Burpees 0:20, Rest 0:10] × 8, Recover 1:00, "Climber Tabata" [Mountain Climbers 0:20, Rest 0:10] × 8, Recover 1:00] · Cool-down 4:00 |
| Upper/Lower Circuit | Advanced | Circuit | 36:30 | Warm-up 5:00 · "Upper/Lower" × 3 ["Upper" [Push-ups 0:40, Rest 0:20, Inverted Rows 0:40, Rest 0:20] × 2, Switch 0:30, "Lower" [Jump Lunges 0:40, Rest 0:20, Squat Jumps 0:40, Rest 0:20] × 2, Round rest 1:30] · Cool-down 5:00 |
| EMOM 20 | Advanced | EMOM | 28:00 | Warm-up 5:00 · [12 Burpees, 15 Kettlebell Swings, 15 Push-ups, 20 Jump Lunges: 1:00 each] × 5 · Cool-down 3:00 |

Every Group drops its trailing Rest on the last Round (the default). Hand-built with named nested Groups: Sprint Repeats, Burpee & Climber Tabatas, Upper/Lower Circuit. Open points for review: there is no intermediate EMOM; Sprint Repeats needs room to run, Upper/Lower Circuit needs a bar or sturdy table for Inverted Rows, and EMOM 20 needs a kettlebell; every other Sample is bodyweight only.
