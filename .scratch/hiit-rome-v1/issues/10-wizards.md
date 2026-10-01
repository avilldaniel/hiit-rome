# 10 — Wizards

**What to build:** The trainer picks a Wizard (HIIT, Tabata, Circuit or EMOM), fills in a short form while watching the total duration update live, and chooses "Start now" or "Save & edit". The result is an ordinary Workout with no link back to the Wizard.

Reference: spec "Wizards" (exact generated structures), "Building Workouts: Wizards" stories.

**Blocked by:** 06 — Workout editor: build and edit

**Status:** ready-for-agent

- [ ] Wizard functions are pure: parameters in, Workout out, with a proposed default name (e.g. "Tabata ×4 (20/10)"). Warm-up and Cool-down are omitted when set to 0.
- [ ] HIIT: Warm-up → Group[Work, Rest] × Rounds → Cool-down; the optional exercise name is used for Work.
- [ ] Tabata: an outer Group named "Tabata" × count, containing [unnamed Group[Work, Rest] × Rounds, Rest "Between Tabatas"]; with a count of 1 there is no outer Group.
- [ ] Circuit: Group[Ex1, Rest, …, ExN, Rest "Round rest"] × Rounds; exercise names become Work Interval names.
- [ ] EMOM: Group[Ex1 60 s … ExN 60 s] × Rounds, all Work.
- [ ] Engine tests for each Wizard assert structure, names and total duration via the Timeline (seam A).
- [ ] Wizard picker reachable from home. Each form shows a live total; "Start now" saves and starts; "Save & edit" saves and opens the editor.
- [ ] A Playwright smoke test: Tabata Wizard → Start now → Session screen.
