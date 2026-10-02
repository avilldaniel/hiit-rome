# 06 — Workout editor: build and edit

**What to build:** The trainer creates a blank Workout or edits an existing one in an outline that mirrors its structure. They can:
- add Intervals and Groups
- edit names, Kinds, durations and colors inline
- set each Group's name, Rounds and "Skip last rest"
- watch the total duration update live
- start a Session straight from the editor

Reference: spec "Building Workouts: editor" stories, "Workout model".

**Blocked by:** 05 — My Workouts: storage and home

**Status:** resolved (branch v1, commit 3119c8f)

- [x] New Workout (from home) and Edit (from a card) open the editor, and changes save to the store.
- [x] Outline view: Groups are indented and collapsible, and the Group nesting limit is 2 levels.
- [x] Inline edits: Interval name; Kind (default color follows the Kind); duration, accepting "90" or "1:30"; and a color override from the 5 palette colors with the paired text color applied.
- [x] Group settings: optional name, Rounds (1–99), and "Skip last rest" (default on).
- [x] Delete items with Undo.
- [x] Live total duration that accounts for skipped rests, computed from the Timeline builder.
- [x] Empty Groups are flagged. Starting a Workout with no Intervals is blocked with a clear message.
- [x] Start from the editor.
- [x] A Playwright smoke test builds a small Workout (an Interval plus a Group with 2 Rounds), checks the total, and starts it.

## Comments

- Editor edits are pure functions on the outline in `src/lib/engine/outline.ts` (add, update, remove/restore, nesting check, empty-Group flags, start blocker), tested at the model level; ticket 07's restructuring operations belong there too.
- "Empty" means the Group adds nothing to the Timeline, so a Group whose only Interval is a Rest dropped by Skip last rest is flagged as well.
- New Workout saves a blank "Untitled Workout" before opening the editor, so one abandoned straight away stays in My Workouts until deleted.
- The Session route also refuses a Workout with nothing to play (e.g. Start on a card), linking to its editor.
- Delete in the editor offers Undo for the most recent deletion only, as on home.
