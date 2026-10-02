# 07 — Workout editor: restructure

**What to build:** The trainer can reshape a Workout quickly:
- drag Intervals and Groups to reorder them, including into and out of Groups
- duplicate items to build "Exercise 1, Exercise 2, …" fast
- select several Intervals and wrap them in a Group

Reference: spec "Building Workouts: editor" stories.

**Blocked by:** 06 — Workout editor: build and edit

**Status:** resolved (branch v1, commit e1ed93d)

- [x] Drag to reorder within a level and into or out of Groups. Drops that would exceed 2 levels of Group nesting are refused, with visible feedback.
- [x] Duplicate an Interval or a Group (deep copy) directly after the original.
- [x] Multi-select Intervals at the same level, then "Wrap in Group" (1 Round by default, Skip last rest on).
- [x] All operations are undoable and update the live total.
- [x] Restructuring operations are tested at the model level (pure functions on the Workout), not via the DOM.

## Comments

- Restructuring is pure functions in `src/lib/engine/outline.ts`: `moveBlocker`/`moveItem`, `duplicateItem`, `wrapBlocker`/`wrapInGroup`. Moves are also refused when they would put a Group inside itself.
- Drag uses HTML5 drag-and-drop on a grip handle, so it's mouse-only. There is no keyboard or touch fallback yet. Dropping on a row places the item before it, and dropping on a level's "+ Add" row places it at the end. To drop inside a collapsed Group, expand it first.
- Duplicate adds one to a trailing number in the copy's own name ("Exercise 1" → "Exercise 2"). Names inside a duplicated Group stay as they are.
- Undo now covers the most recent move, duplicate, wrap or delete. Any later outline edit dismisses it, so reverting never discards a newer change. Unlike ticket 06, this means an edit after a delete now dismisses its Undo.
