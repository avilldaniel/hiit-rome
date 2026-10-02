# 10 — Wizards

**What to build:** The trainer picks a Wizard (HIIT, Tabata, Circuit or EMOM), fills in a short form while watching the total duration update live, and chooses "Start now" or "Save & edit". The result is an ordinary Workout with no link back to the Wizard.

Reference: spec "Wizards" (exact generated structures), "Building Workouts: Wizards" stories.

**Blocked by:** 06 — Workout editor: build and edit

**Status:** resolved (branch v1, commit 5f0e1f7)

- [x] Wizard functions are pure: parameters in, Workout out, with a proposed default name (e.g. "Tabata ×4 (20/10)"). Warm-up and Cool-down are omitted when set to 0.
- [x] HIIT: Warm-up → Group[Work, Rest] × Rounds → Cool-down; the optional exercise name is used for Work.
- [x] Tabata: an outer Group named "Tabata" × count, containing [unnamed Group[Work, Rest] × Rounds, Rest "Between Tabatas"]; with a count of 1 there is no outer Group.
- [x] Circuit: Group[Ex1, Rest, …, ExN, Rest "Round rest"] × Rounds; exercise names become Work Interval names.
- [x] EMOM: Group[Ex1 60 s … ExN 60 s] × Rounds, all Work.
- [x] Engine tests for each Wizard assert structure, names and total duration via the Timeline (seam A).
- [x] Wizard picker reachable from home. Each form shows a live total; "Start now" saves and starts; "Save & edit" saves and opens the editor.
- [x] A Playwright smoke test: Tabata Wizard → Start now → Session screen.

## Comments

**Agent (implementation):** All items are done. Engine Wizards are tested through the Timeline (Seam A). Playwright covers Tabata → Start now → Session, and Circuit → Save & edit → editor. Decisions worth a look:
- **Any Rest set to 0 is also left out**, not only Warm-up and Cool-down: the HIIT and Tabata Rest, "Between Tabatas", and the Circuit Rest and "Round rest". An Interval can't be 0 s, so the alternative was to refuse 0. That would rule out the common "no rest between exercises" circuit.
- **Default names:** "Burpees ×8 (40/20)", or "HIIT ×8 (40/20)" with no exercise; "Tabata ×4 (20/10)", or "Tabata (20/10)" for a single one; "Circuit ×3 (45/15)"; "EMOM ×10 (3 exercises)". The name field follows these until the trainer types their own.
- **"Start now" opens the Session screen ready to go** ("Press Space or tap to start"). It does not start the Lead-in by itself. This matches every other Start button in the app.
- **Durations update the live total once committed** (Enter or leaving the field), as in the editor. Rounds and exercises update it as they're typed.
- **Defaults:** HIIT 40/20 × 8; Tabata 20/10 × 8, one Tabata, 1:00 between; Circuit 45/15 × 3 with a 1:00 Round rest; EMOM × 10. Warm-up and Cool-down start at 0:00.
