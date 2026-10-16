---
id: edit
name: Workout editor
route: /edit/[id] (e.g. /edit/5e252277-f702-4f9d-86d5-09df56d4a1f4)
source: src/routes/edit/[id]/+page.svelte, src/lib/editor/WorkoutEditor.svelte, src/lib/editor/TimelinePanel.svelte, src/lib/editor/WorkoutSettings.svelte, src/lib/editor/OutlineItems.svelte, src/lib/editor/IntervalRow.svelte, src/lib/editor/DurationInput.svelte, src/lib/editor/DragHandle.svelte, src/lib/transfer/ShareButton.svelte
viewports: [desktop, mobile]
---

# Workout editor

Build or change a Workout: a nested outline of Intervals and repeating Groups. It saves as you type, and shows a live Timeline and total.

## Regions
- **Header bar** (white, full width, bottom border): back link, the Workout name as a large inline text field, the live total ("Total 44:05") on the right, then Share and Start.
- **Column** (centered, max width), in order:
  1. alert messages (blocked start, save failure);
  2. **Timeline panel** (white card: "Timeline", the count and total, a tall strip of rounded segments, and a time axis with ticks every 5:00);
  3. **Workout settings** (a collapsible `details` card, closed by default);
  4. **Selection toolbar** (sticky, only while Intervals are ticked);
  5. **Outline** (main): rows and Groups.
- **Outline rows**: Interval rows are white cards. Each Group is a light-gray rounded container with a header row and its children indented inside. Each level ends with "Add Interval" / "Add Group".
- **Toast** (bottom center): Undo. **Drag refusal** notice (floats while dragging over a spot that won't take the item).
- At narrow widths the header wraps and the row controls wrap.

## Navigation
- **← My Workouts** back link → `/`.
- **Start** → `/session/<id>` once all saves finish.

## Actions
- Header:
  - **Share** (outline button with share icon): same behavior as on home; the notice shows beside it.
  - **Start** (primary, play icon): refuses with a message when there's nothing to play.
- Interval row:
  - drag handle (grip; "Drag Interval <name>", tooltip "Drag to move"), drag to reorder or move into or out of Groups;
  - select checkbox ("Select <name>");
  - **Duplicate** (icon, "Duplicate <name>");
  - **Delete** (icon danger, "Delete <name>", undoable).
- Group header:
  - drag handle;
  - **Collapse / Expand** (chevron icon button, `aria-expanded`);
  - **Duplicate** and **Delete** icons ("Duplicate Group <name>" / "Delete Unnamed Group").
- End of every level:
  - **+ Add Interval** (adds a 30s Work Interval);
  - **+ Add Group** (adds a ×2 Group; disabled with tooltip "Groups nest at most 2 levels deep" once too deep).
- Selection toolbar ("Selected Intervals"):
  - "<n> selected";
  - **Wrap in Group** (primary; disabled with the reason shown beside it);
  - **Clear** (ghost).
- Toast **Undo**: after Delete, Duplicate, Move or Wrap ("Deleted Interval", "Duplicated Group", "Moved Interval", "Wrapped 2 Intervals in a Group"); stays 8s.

## Fields
- **Workout name** (header, text; placeholder "Untitled Workout"; a blank name reverts to "Untitled Workout").
- Workout settings:
  - **Lead-in** (number, seconds, 0–99; red border when invalid; suffix "s");
  - one select per Cue (**Announce each Interval**, **Warning**, **Final-seconds beeps**, **Halfway**, **Workout complete**), each Default (On|Off) / On / Off;
  - under Warning, **Warning seconds** (number 1–99; placeholder is the global default, e.g. "10"; suffix "s before the end").
  - Hint: "Cues set to Default follow Settings."
- Interval row:
  - **Interval name** (text; placeholder is the Kind label);
  - **Kind** select (Warm-up / Work / Rest / Cool-down; the select is tinted by Kind);
  - **Duration** (text in a Kind-colored tile; accepts "90" or "1:30", from 0:01 to 99:59; when invalid, a red state with tooltip `Enter seconds ("90") or m:ss ("1:30"), from 0:01 to 99:59`);
  - **Color** select (Kind color / Red / Blue / Yellow / Green / Black).
- Group header:
  - **Group name** (text; placeholder "Unnamed Group");
  - **Rounds** (number 1–99 in an ink pill "× [n] Rounds"; an invalid value snaps back);
  - **Skip last rest** (checkbox).

## Data displays
- **Total** in the header ("44:05", live).
- **Timeline panel**: "Timeline", "32 Intervals · 44:05", a tall segmented strip (one segment per Interval as it plays, Groups expanded by Rounds), and an axis of "0:00 5:00 10:00 …".
- **Outline**: nested rows. Sample Interval row: "☐ Hammer Press · Work · 1:00 · Kind color". Sample Group header: "Drill 1 · × 1 Rounds · ☑ Skip last rest". Typical: 7 top-level items, 4 Groups, 27 Intervals.

## Sections
- Timeline; Workout settings; Outline (in that order)

## States
- **Loaded** (captured: edit.png, edit.mobile.png).
- **Workout settings open** (captured: edit@settings-open.png).
- **Intervals selected**: sticky toolbar (captured: edit@selection.png). Wrap refused: reason beside the disabled button ("Select Intervals at the same level", "Only Intervals can be wrapped").
- **Undo toast** (captured: edit@undo-toast.png).
- **Group collapsed**: its children hidden, chevron points right.
- **Empty Group**: dashed yellow border on the Group, plus a yellow note "Empty Group: it plays nothing, so it will be skipped. Add an Interval (a final Rest is dropped when Skip last rest is on)."
- **Empty Workout**: just the Add buttons; the Timeline panel shows "0 Intervals · 0:00" without a strip.
- **Start blocked**: alert "Nothing to play yet: add an Interval before starting."
- **Save failed**: alert "Your changes couldn’t be saved. Try reloading the page."
- **Dragging**: drop spots highlight as allowed or refused; refusal notice "Can’t drop here: A Group can’t go inside itself" (or the too-deep reason).
- **Invalid field**: red border (Lead-in, Warning seconds, Duration).
- **Loading**: blank. **Not found**: page "Workout not found" / "It may have been deleted." / "Back to My Workouts".

## Copy
- "← My Workouts" (back link), "Total", "Share", "Start"
- "Workout name", "Untitled Workout"
- "Timeline", "<n> Intervals · <total>"
- "Workout settings", "Lead-in", "Lead-in seconds", "s", "Default (On)", "Default (Off)", "On", "Off", "Warning seconds", "s before the end", "Cues set to Default follow Settings."
- Cue labels: "Announce each Interval", "Warning", "Final-seconds beeps", "Halfway", "Workout complete"
- "Interval name", "Kind", "Duration", "Color", "Kind color", "Red", "Blue", "Yellow", "Green", "Black"
- "Group name", "Unnamed Group", "×", "Rounds", "Skip last rest"
- "Add Interval", "Add Group", "Groups nest at most 2 levels deep", "Drag to move", "Duplicate", "Delete"
- "<n> selected", "Wrap in Group", "Clear", "Select Intervals to wrap", "Only Intervals can be wrapped", "Select Intervals at the same level"
- "Deleted Interval", "Deleted Group", "Duplicated Interval", "Moved Group", "Wrapped <n> Intervals in a Group", "Undo"
- "Empty Group: it plays nothing, so it will be skipped. Add an Interval (a final Rest is dropped when Skip last rest is on)."
- "Nothing to play yet: add an Interval before starting.", "Your changes couldn’t be saved. Try reloading the page."
- "Can’t drop here: <reason>", "A Group can’t go inside itself"
- `Enter seconds ("90") or m:ss ("1:30"), from 0:01 to 99:59`
- "Workout not found", "It may have been deleted.", "Back to My Workouts"
