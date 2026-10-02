# Roadmap: deferred from v1

Everything below was deliberately left out of v1 during the initial design grilling (2026-10-01). Each item notes why it was deferred and what v1 does to keep it cheap to add later. Terms follow [GLOSSARY.md](../GLOSSARY.md).

## Music

- **Workout music (Spotify), Level 1 — first follow-up after v1.** Link a Spotify playlist to a Workout; it plays, pauses, ducks under spoken Cues, and stops with the Session. Needs Spotify Premium; Development Mode caps at 25 allow-listed users (fine for a small circle). Desktop browsers only, so no Spotify playback in phone browsers.
  - *v1 prep:* the Session emits audio events in a shape any music source can follow.
- **Kind music, Level 2.** A separate playlist per Kind (e.g. Work vs Rest), each resuming where it left off. Revisit after real use of Level 1.
- **Interval music, Level 3 — likely never.** A track per Interval, as in Seconds Pro. Jarring for short Intervals.
- **Imported audio files — dropped.** Managing per-file uploads costs a lot for little value.

## Devices and control

- **Phone-as-remote.** The TV shows the Session display and a phone sends start, pause and skip. Needs real-time sync between devices, and so a backend or WebRTC pairing.
  - *v1 prep:* the timer engine is separate from display and controls.
- **Phone-first pivot.** The app ships as an installable PWA, but layouts are designed for large landscape screens first. Full background running on iOS is fragile in browsers.
  - *v1 prep:* the clock is timestamp-based, so it never drifts when the browser suspends it.

## Accounts and data

- **Accounts, cloud sync, any backend.** v1 is device-local by design (see ADR 0001). Share links and backup files cover moving Workouts between devices.
- **Workout history and logging** (e.g. "14 workouts this month").

## Building workouts

- **Pyramid Wizard.** Work steps of rising then falling length (e.g. 20/30/40/50/40/30/20) with Rest between.
- **Groups nested deeper than 2 levels in the editor.** The model already supports any depth; only the editor caps it.
- **Workout folders.** v1 has a flat list with search, sort and Favorites.
- **Reusable snippets.** For example, "insert my standard warm-up" into any Workout.
- **Multi-Workout operations.** Bulk delete, bulk export of a selection, and similar.
- **Re-runnable Wizards.** A Workout that remembers its Wizard parameters so it can be regenerated. This was rejected for v1 because regenerating would wipe hand edits.

## Audio

- **Pre-recorded or AI voices.** They can't speak custom Interval names without a server. v1 uses the device's built-in speech.

## Other

- **Multiple languages.** v1 is English only.
- **Apple Watch, heart-rate and health integrations.**
- **Larger color palette.** v1 uses the 5-color palette; per-Interval color overrides are limited to those 5.
