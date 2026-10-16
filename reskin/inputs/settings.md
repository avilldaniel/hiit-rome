---
id: settings
name: Settings
route: /settings
source: src/routes/settings/+page.svelte, src/lib/transfer/BackupSection.svelte, src/lib/ui/Switch.svelte, src/lib/editor/DurationInput.svelte
viewports: [desktop, mobile]
---

# Settings

Set the device-wide defaults: the voice, which Cues play, the Pause behavior, and the Countdown Presets and color. Back up or restore everything.

## Regions
- **Header**: back link, "Settings" (h1).
- **Two columns** of white cards:
  - left: Voice, Cues, Pause;
  - right: Countdown, Backup.
- One column on narrow screens.
- **Import dialog** (modal) over the page.

## Navigation
- **← My Workouts** → `/`.
- The Countdown card has the anchor `#countdown-heading`, which the Countdown screen links to.

## Actions
- **Test voice** (speaker icon): speaks "This is how your Cues will sound." in the chosen voice.
- **Export backup** (down-tray icon): downloads `hiit-rome-backup-<date>.json`, then shows "Saved <filename>." and updates "Last backed up".
- **Import backup** (up-tray icon; a label around a hidden file input, `.json`): reads the file, then opens the Import dialog. A bad file shows the error inline instead.
- Import dialog: **Cancel**; **Import** (primary, up-tray icon). Esc closes it.
- Every change saves as it's made; there is no Save button.

## Fields
- Voice card: **Voice** (inline-label select: "Device default", then each installed voice as "<name> (<lang>)").
- Cues card: hint "The defaults for every Workout; a Workout can override them in its own settings." Then switch rows:
  - **Announce each Interval**;
  - **Warning**, with **Warning seconds** (number 1–99, default 10) and the suffix "s before the end";
  - **Final-seconds beeps**;
  - **Halfway** (off by default);
  - **Workout complete**.
- Pause card: switch **3 s Lead-in when resuming from pause**.
- Countdown card:
  - hint "The five Presets offered as one-tap starts.";
  - **Preset 1**–**Preset 5** (duration text fields, "1:00", "3:00", "5:00", "10:00", "15:00");
  - **Color** (inline-label select: Red / Blue / Yellow / Green / Black) with a live "0:00" swatch in that color;
  - switch **Say “1 minute remaining” on Countdowns over 1 minute**.
- Import dialog: checkbox **Also replace my Settings and Presets with the backup’s** (off by default).

## Data displays
- **Last backed up**: "never", or a date such as "Oct 12, 2026, 10:41 PM".
- The Countdown color swatch.
- Import dialog summary: "This backup from <date> has <n> Workouts. They’re added alongside yours, skipping any you already have; none of yours change."

## Sections
- "Voice", "Cues", "Pause", "Countdown", "Backup"
- Backup hint: "Your Workouts live only on this device. Export a backup now and then, and import it here or on another device."

## States
- **Loaded** (captured: settings.png, settings.mobile.png).
- **Loading**: header only.
- **Load error**: alert "Your Settings couldn’t be loaded. Try reloading the page."
- **Save failed**: alert above the columns "Your changes couldn’t be saved. Try reloading the page."
- **Invalid Warning seconds**: red border.
- **Exported**: "Saved hiit-rome-backup-2026-10-12.json." (captured: settings@exported.png).
- **Export failed**: alert "The backup couldn’t be made. Try reloading the page."
- **Import dialog open** (captured: settings@import-dialog.png).
- **Imported**: "Added <n> Workouts; <n> Workouts already here were skipped; Settings and Presets replaced." (each part only when it applies).
- **Import failed**: "The backup couldn’t be imported, so nothing changed. Try reloading the page."
- **Bad file**: "This file isn’t a hiit-rome backup. Choose a file made with “Export backup”." / "This backup file is damaged, so nothing was imported." / "This backup was made by a newer version of hiit-rome. Reload the app to update it, then import it again."

## Copy
- "← My Workouts", "Settings"
- "Voice", "Device default", "Test voice", "This is how your Cues will sound."
- "Cues", "The defaults for every Workout; a Workout can override them in its own settings.", "Announce each Interval", "Warning", "Warning seconds", "s before the end", "Final-seconds beeps", "Halfway", "Workout complete"
- "Pause", "3 s Lead-in when resuming from pause"
- "Countdown", "The five Presets offered as one-tap starts.", "Preset 1"…"Preset 5", "Color", "Red", "Blue", "Yellow", "Green", "Black", "Say “1 minute remaining” on Countdowns over 1 minute"
- "Backup", "Your Workouts live only on this device. Export a backup now and then, and import it here or on another device.", "Last backed up:", "never", "Export backup", "Import backup"
- "Import backup" (dialog title), "This backup from <date> has <n> Workouts. They’re added alongside yours, skipping any you already have; none of yours change.", "Also replace my Settings and Presets with the backup’s", "Cancel", "Import"
- All the outcome and error messages listed under States.
