# 06 — Workout editor: build and edit

**What to build:** The trainer creates a blank Workout or edits an existing one in an outline that mirrors its structure. They can:
- add Intervals and Groups
- edit names, Kinds, durations and colors inline
- set each Group's name, Rounds and "Skip last rest"
- watch the total duration update live
- start a Session straight from the editor

Reference: spec "Building Workouts: editor" stories, "Workout model".

**Blocked by:** 05 — My Workouts: storage and home

**Status:** ready-for-agent

- [ ] New Workout (from home) and Edit (from a card) open the editor, and changes save to the store.
- [ ] Outline view: Groups are indented and collapsible, and the Group nesting limit is 2 levels.
- [ ] Inline edits: Interval name; Kind (default color follows the Kind); duration, accepting "90" or "1:30"; and a color override from the 5 palette colors with the paired text color applied.
- [ ] Group settings: optional name, Rounds (1–99), and "Skip last rest" (default on).
- [ ] Delete items with Undo.
- [ ] Live total duration that accounts for skipped rests, computed from the Timeline builder.
- [ ] Empty Groups are flagged. Starting a Workout with no Intervals is blocked with a clear message.
- [ ] Start from the editor.
- [ ] A Playwright smoke test builds a small Workout (an Interval plus a Group with 2 Rounds), checks the total, and starts it.
