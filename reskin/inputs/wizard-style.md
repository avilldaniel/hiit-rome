---
id: wizard-style
name: Wizard form
route: /wizard/[style] (hiit | tabata | circuit | emom; captured with /wizard/tabata)
source: src/routes/wizard/[style]/+page.svelte, src/lib/wizards/WizardForm.svelte, src/lib/wizards/HiitForm.svelte, src/lib/wizards/TabataForm.svelte, src/lib/wizards/CircuitForm.svelte, src/lib/wizards/EmomForm.svelte, src/lib/wizards/FieldGroup.svelte, src/lib/wizards/DurationField.svelte, src/lib/wizards/CountField.svelte, src/lib/wizards/ExercisesField.svelte, src/lib/wizards/BookendFields.svelte
viewports: [desktop, mobile]
---

# Wizard form

Fill in a few numbers for one style (HIIT, Tabata, Circuit or EMOM), watch the total update live, then start the Workout right away or save it and fine-tune it in the editor.

## Regions
- **Header**: back link "← Wizards", the Wizard title (h1, e.g. "Tabata").
- **Form**, two columns:
  - **Fields card** (left, white, wide): fieldsets with legends and their fields two to a row (a `.wide` field takes a whole row), then a hint line;
  - **"Your Workout" card** (right, white, sticky): Name, Total, Timeline strip, and the two finish buttons.
- At narrow widths the cards stack.

## Navigation
- **← Wizards** → `/wizard`.
- Start now → `/session/<new id>`; Save & edit → `/edit/<new id>`.

## Actions
- **Start now** (primary, large, play icon): validates, saves the Workout to My Workouts, opens its Session.
- **Save & edit** (large, pencil icon): validates, saves, opens the editor.
- Both are disabled while saving. If a field is invalid, the browser's own validation bubble points to the first bad field.

## Fields
All the duration fields accept "90" or "1:30". "Optional" ones also accept 0:00, which leaves that Interval out. The fields are large, with text in the display face.
- **HIIT**:
  - Each Round: **Exercise** (text, wide, placeholder "Work"), **Work** (0:40), **Rest** (optional, 0:20);
  - Repeats: **Rounds** (8);
  - Before and after: **Warm-up**, **Cool-down** (optional, 0:00).
- **Tabata**:
  - Each Round: **Work** (0:20), **Rest** (optional, 0:10);
  - Repeats: **Rounds** (8), **Tabatas** (1), **Rest between Tabatas** (optional, 1:00, shown only when Tabatas > 1);
  - Before and after: **Warm-up**, **Cool-down**.
- **Circuit**:
  - Each Round: **Exercises** (textarea, wide, 8 rows, one per line, placeholder "Squats / Push-ups / Lunges", at least one required: "Add at least one exercise, one per line."), **Work per exercise** (0:45), **Rest between exercises** (optional, 0:15);
  - Repeats: **Rounds** (3), **Rest between Rounds** (optional, 1:00);
  - Before and after: **Warm-up**, **Cool-down**.
- **EMOM**:
  - Each Round: **Exercises** (textarea);
  - Repeats: **Rounds** (10);
  - Before and after: **Warm-up**, **Cool-down**.
- Count fields (Rounds, Tabatas): whole numbers 1–99, error "Enter a whole number from 1 to 99".
- Duration fields: invalid shows a red state with tooltip `Enter seconds ("90") or m:ss ("1:30"), from 0:01 to 99:59` (or "from 0:00" for optional ones).
- **Name** (Your Workout card, text, aria "Workout name"): follows the Wizard's proposal ("Tabata (20/10)", "HIIT ×8 (40/20)", "EMOM ×10 (3 exercises)") until the trainer types their own; clearing it goes back to the proposal.

## Data displays
- **Total**: "3:50" (huge, live).
- **Timeline strip** of the Workout as configured.

## Sections
- Fieldsets: "Each Round", "Repeats", "Before and after"
- Hint (one line, under the fields): "Set Warm-up, Cool-down or any Rest to 0:00 to leave it out." For EMOM: "Each exercise gets a minute. Set Warm-up or Cool-down to 0:00 to leave it out."
- "Your Workout" card.

## States
- **Tabata form** (captured: wizard-style.png, wizard-style.mobile.png).
- **Circuit form** (textarea variant) (captured: wizard-style@circuit.png). HIIT and EMOM forms follow the same frame.
- **Tabatas > 1**: the extra "Rest between Tabatas" field appears.
- **Invalid field**: red field plus the browser validation bubble on finish.
- **Saving**: both buttons disabled.
- **Save failed**: alert "Your Workout couldn’t be saved. Try again." above the buttons.
- **Unknown style**: page "Wizard not found" with link "Back to Wizards" (captured: wizard-style@not-found.png).

## Copy
- "← Wizards", "HIIT", "Tabata", "Circuit", "EMOM", "<title> Wizard" (group label)
- "Each Round", "Repeats", "Before and after"
- "Exercise", "Work", "Rest", "Rounds", "Tabatas", "Rest between Tabatas", "Exercises", "Work per exercise", "Rest between exercises", "Rest between Rounds", "Warm-up", "Cool-down"
- "Set Warm-up, Cool-down or any Rest to 0:00 to leave it out.", "Each exercise gets a minute. Set Warm-up or Cool-down to 0:00 to leave it out."
- "Your Workout", "Name", "Workout name", "Total", "Start now", "Save & edit"
- "Your Workout couldn’t be saved. Try again.", "Add at least one exercise, one per line.", "Enter a whole number from 1 to 99"
- "Wizard not found", "Back to Wizards"
