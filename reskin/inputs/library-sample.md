---
id: library-sample
name: Sample preview
route: /library/[id] (e.g. /library/sample-double-tabata)
source: src/routes/library/[id]/+page.svelte, src/lib/preview/WorkoutPreview.svelte, src/lib/preview/WorkoutOutline.svelte, src/lib/preview/PreviewPage.svelte, src/lib/preview/PreviewMessage.svelte
viewports: [desktop, mobile]
---

# Sample preview

See exactly what a Sample contains, then start it as it is or add a copy to My Workouts to change.

## Regions
- **Preview card** (left, white, rounded; the back link is drawn inside it at the top): name, chips, description, Total, Timeline strip, actions, and the status line.
- **Outline** (right): an "Outline" h2 and a read-only nested outline.
- At narrow widths the outline stacks under the card.

## Navigation
- **← Library** → `/library`.
- **Start** → `/session/<sample id>` (runs the Sample without copying it).
- After adding: **Edit your copy** → `/edit/<new id>`.

## Actions
- **Start** (primary, large, play icon). Hidden when the Workout has nothing to play.
- **Add to My Workouts** (large, plus-box icon): stores a copy with a fresh id. Repeatable; each tap adds another copy.

## Fields
- none

## Data displays
- Name (h1), chips (Level, Style), description (the Sample blurb).
- **Total** ("15:40", huge).
- **Timeline strip**.
- **Outline**:
  - Interval rows: a Kind-colored time tile ("0:20"), the name, and a Kind tag tinted by Kind ("Work");
  - Groups: light containers titled with the name plus an ink pill "× 2", or just a pill "8 Rounds" when unnamed; children indented inside.
  - Sample: "Tabata × 2 → 8 Rounds → [0:20 Squat Jumps Work, 0:10 Rest Rest], 1:00 Between Tabatas Rest".

## Sections
- Preview card; "Outline".

## States
- **Default** (captured: library-sample.png, library-sample.mobile.png).
- **Added**: status "Added “Double Tabata” to My Workouts. Edit your copy" (captured: library-sample@added.png).
- **Add failed**: alert "It couldn’t be added. Try again."
- **Nothing to play**: Start hidden; status "Nothing to play yet: add an Interval before starting."
- **Unknown Sample**: message card "Sample not found" with link "Back to the Library" (captured: library-sample@not-found.png).

## Copy
- "← Library", "Total", "Start", "Add to My Workouts", "Outline"
- Level chips "Beginner" / "Intermediate" / "Advanced"; style chips
- Kind labels "Warm-up", "Work", "Rest", "Cool-down"; "× <n>", "<n> Rounds"
- "Added “<name>” to My Workouts.", "Edit your copy", "It couldn’t be added. Try again."
- "Sample not found", "Back to the Library"
