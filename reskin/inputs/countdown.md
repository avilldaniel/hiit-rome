---
id: countdown
name: Countdown
route: /countdown
source: src/routes/countdown/+page.svelte, src/lib/session/CountdownScreen.svelte, src/lib/session/ControlBar.svelte, src/lib/session/ConfirmDialog.svelte, src/lib/session/EndCurrentPrompt.svelte, src/lib/editor/DurationInput.svelte
viewports: [desktop, mobile]
---

# Countdown

A plain timer for anything that isn't a Workout: one tap on a Preset (or a custom time) starts a full-screen countdown that ends with a big TIME.

## Regions
- **Setup** (default):
  - header: back link, "Countdown" (h1);
  - **Presets** section: h2, then a row of five large square tiles in the Countdown color, each showing its time, and an "Edit Presets in Settings" link under them;
  - **Custom** card (white): h2, a duration field and a Start button.
- **Running screen** (replaces the setup): one full-screen Panel in the Countdown color (ink when paused), with an eyebrow, the giant time, a progress bar, and the control bar (shown after a pointer move or tap). No rail.
- **TIME screen**: the panel with a huge "TIME" heading and a Dismiss button.
- **End-current prompt**: a dimmed backdrop with a centered card.

## Navigation
- **← My Workouts** → `/`.
- **Edit Presets in Settings** → `/settings#countdown-heading`.
- End-current prompt: **Back to <current>** goes back to the Session (on its screen) or the Countdown under way.

## Actions
- **Preset tiles** (5; accessible name "Start a 1:00 Countdown"): start at once.
- **Custom → Start** (primary, large, play icon; submits the form).
- Running, keyboard: Space pause/resume; ↑ +30 s; ↓ −30 s; Esc asks to end; R asks to restart (paused only); F fullscreen. Touch: tap to pause or resume.
- Running, control bar: **−30 s**, **Pause/Resume** (primary), **+30 s**, **Restart** (paused only), **End**. No Previous/Next/Intervals.
- Confirm end: "End this Countdown?" → **Keep going** / **End Countdown**.
- Confirm restart: "Restart the Countdown from the beginning?" → **Cancel** / **Restart**.
- TIME: **Dismiss** (or Space, Enter, Esc, or a tap) → back to the setup.
- End-current prompt: **Back to <current>** / **End <current>** (ends it, then starts the Countdown).

## Fields
- **Custom duration** (visually hidden label; large duration text field, default "2:00"; accepts "90" or "1:30", 0:01–99:59; invalid shows a red state with the hint tooltip).

## Data displays
- **Preset tiles**: "1:00", "3:00", "5:00", "10:00", "15:00" (the defaults; editable in Settings), colored by the Countdown color setting (Blue by default).
- Running: eyebrow "Countdown" (or "Paused"), the remaining time ("0:03"), and a progress bar.

## Sections
- "Presets"; "Custom"

## States
- **Setup** (captured: countdown.png, countdown.mobile.png).
- **Loading**: header only.
- **Presets failed to load**: alert "Your Presets couldn’t be loaded. Try reloading the page."
- **Running** with the control bar shown (captured: countdown@running.png).
- **Paused**: ink panel, eyebrow "Paused", Restart added.
- **Final seconds**: the time pulses.
- **TIME** (captured: countdown@time-up.png).
- **Confirm end / Confirm restart** dialogs (not captured).
- **End-current prompt**: "Lean Burn 11/12 is still under way. End it to start a Countdown?" (captured: countdown@end-current.png).
- **Resumed** after a reload, via the Resume prompt: comes back paused.

## Copy
- "← My Workouts", "Countdown", "Presets", "Edit Presets in Settings", "Custom", "Custom duration", "Start"
- "Start a <m:ss> Countdown"
- "Countdown", "Paused", "TIME", "Dismiss"
- Controls: "−30 s", "Pause", "Resume", "+30 s", "Restart", "End"
- "End this Countdown?", "End Countdown", "Keep going", "Restart the Countdown from the beginning?", "Restart", "Cancel"
- "<current> is still under way. End it to start a Countdown?", "End <current>", "Back to <current>"
- "Your Presets couldn’t be loaded. Try reloading the page."
