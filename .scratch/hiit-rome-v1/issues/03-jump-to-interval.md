# 03 — Jump to any Interval

**What to build:** During a Session, the trainer presses J (or uses the control bar) to open a list of every Interval in the Session, grouped by Group and Round. Picking one jumps straight to its start. This covers "start this Round over" and "go back to Tabata 2".

Reference: spec "Session engine" (jump).

**Blocked by:** 02 — Session controls and summary

**Status:** resolved (branch `v1`, commit 9ff0f05)

- [x] Engine: jump to entry goes to the start of that entry and keeps the current running or paused state; tested.
- [x] The Interval list shows every Timeline entry under its Group and Round headings, highlights the current entry, and is usable by keyboard (arrows and Enter, Esc to close) and by touch.
- [x] Opening the list doesn't pause the Session.
- [x] A Playwright smoke test: open the list, choose a later Interval, and assert that the display shows it.

## Comments

- Code review (standards + spec) ran against ac9fafe. Fixed: neighbouring Groups whose Rounds read the same (e.g. two 1-Round Groups) were merged under one heading, so Round positions now carry their Group's id; jumping back to an Interval ended early by −30 s replayed a 0 s stub, so −30 s with less than 30 s left is now a one-off skip like → (still counted as completed); Space inside the list is covered by the smoke test; glossary wording; shared rail width.
- Decisions where the spec was silent: J and the "Intervals" button do nothing while idle; jump in the Lead-in starts the chosen Interval; jump keeps that Interval's +30 s / −30 s shortening; list durations include adjustments; unnamed Groups are headed "Round X of Y" at every level in the list (the screen header still omits unnamed outer Groups).
- While the list is open: Space still pauses and resumes (it never picks the focused entry), J closes it, as do Esc, a Close button and a tap outside. It opens on the current entry, which stays highlighted; Home and End go to the ends.
- Deferred: the list rows repeat the rail's chip, name and duration markup (styles differ; a shared row component is a refactor candidate); next, previous and jump each set the clock to an entry's start in one line.
