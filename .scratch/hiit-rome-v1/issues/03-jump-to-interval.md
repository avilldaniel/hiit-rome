# 03 — Jump to any Interval

**What to build:** During a Session, the trainer presses J (or uses the control bar) to open a list of every Interval in the Session, grouped by Group and Round. Picking one jumps straight to its start. This covers "start this Round over" and "go back to Tabata 2".

Reference: spec "Session engine" (jump).

**Blocked by:** 02 — Session controls and summary

**Status:** ready-for-agent

- [ ] Engine: jump to entry goes to the start of that entry and keeps the current running or paused state; tested.
- [ ] The Interval list shows every Timeline entry under its Group and Round headings, highlights the current entry, and is usable by keyboard (arrows and Enter, Esc to close) and by touch.
- [ ] Opening the list doesn't pause the Session.
- [ ] A Playwright smoke test: open the list, choose a later Interval, and assert that the display shows it.
