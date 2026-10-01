# 07 — Workout editor: restructure

**What to build:** The trainer can reshape a Workout quickly:
- drag Intervals and Groups to reorder them, including into and out of Groups
- duplicate items to build "Exercise 1, Exercise 2, …" fast
- select several Intervals and wrap them in a Group

Reference: spec "Building Workouts: editor" stories.

**Blocked by:** 06 — Workout editor: build and edit

**Status:** ready-for-agent

- [ ] Drag to reorder within a level and into or out of Groups. Drops that would exceed 2 levels of Group nesting are refused, with visible feedback.
- [ ] Duplicate an Interval or a Group (deep copy) directly after the original.
- [ ] Multi-select Intervals at the same level, then "Wrap in Group" (1 Round by default, Skip last rest on).
- [ ] All operations are undoable and update the live total.
- [ ] Restructuring operations are tested at the model level (pure functions on the Workout), not via the DOM.
