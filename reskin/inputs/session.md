---
id: session
name: Session
route: /session/[id] (e.g. /session/5e252277-f702-4f9d-86d5-09df56d4a1f4, also Sample ids like /session/sample-double-tabata)
source: src/routes/session/[id]/+page.svelte, src/lib/session/SessionScreen.svelte, src/lib/session/ControlBar.svelte, src/lib/session/IntervalList.svelte, src/lib/session/ConfirmDialog.svelte, src/lib/session/SessionSummary.svelte, src/lib/session/EndCurrentPrompt.svelte, src/lib/ui/Panel.svelte
viewports: [desktop, mobile]
---

# Session

The class runs here, on a TV or laptop seen from across the room: a huge countdown of the current Interval in its Kind color, what's up next, and how much time is left. Cues (spoken announcements and beeps) play as it goes.

## Regions
- **Main panel** (left, most of the screen, rounded, filled with the current Kind's color; ink while ready, in the Lead-in or paused). From top to bottom: an eyebrow line, the Interval name (h1), the giant remaining time, and a progress bar. The **control bar** is pinned to the bottom of the panel, shown only for 3s after a pointer move or tap.
- **Rail** (right, white card): "Up next" heading, the list of upcoming Intervals (the first one large), then a foot with the Group/Round lines and the total time left.
- **Dialogs**: the Interval list (a panel over the rail), confirm dialogs (centered modal).
- Every size is in TV pixels (`--tv`, 1px of a 1920×1080 design scaled to the viewport). In portrait or on narrow screens the rail stacks under the panel.
- No app chrome or nav: the Session fills the screen. F toggles fullscreen.

## Navigation
- No visible nav while running.
- Summary: **Back to My Workouts** → `/`.
- Blocked: "Edit <name>" → `/edit/<id>`. Not found: "Back to My Workouts" → `/`.
- End-current prompt: "Back to <current>" goes to the Session or Countdown still under way.

## Actions
- **Keyboard**: Space start/pause/resume; → next; ← previous; ↑ +30 s; ↓ −30 s; Esc asks to end; R asks to restart (paused only); J opens/closes the Interval list; F toggles fullscreen.
- **Touch**: tap anywhere to start/pause/resume; swipe left for next, right for previous; any press reveals the control bar.
- **Control bar** (large buttons): **Previous**, **−30 s**, **Start** / **Pause** / **Resume** (primary, label follows the status), **+30 s**, **Next**, **Intervals** (once started), **Restart** (paused only), **End** (once started).
- **Interval list**: each entry is a button that jumps to that Interval; **Close**; ↑/↓/Home/End move between entries, Esc or a tap outside closes, and the Session keeps running.
- **Confirm end**: "End this Session?": **Keep going** / **End Session** (focused).
- **Confirm restart**: "Restart the Session from the beginning?": **Cancel** / **Restart** (focused).
- **End-current prompt** (another Session/Countdown still saved): **Back to <current>** / **End <current>**.

## Fields
- none

## Data displays
- **Eyebrow**: the Kind label ("Work", "Rest", "Warm-up", "Cool-down"), "Press Space or tap to start" when ready, "Paused · <Kind>" when paused, "Get ready" in a resume Lead-in.
- **Name**: the Interval's name ("Warm Up"), or "Ready" (idle) / "Get ready" (Lead-in).
- **Remaining time**: "3:58", pulses once per final second.
- **Progress bar**: the fraction of the current Interval elapsed.
- **Up next list**: color swatch, name and duration per upcoming entry ("Set-up 1:00", "Hammer Press 1:00"); the first is larger and set apart by a rule. On the last Interval: just "Finish".
- **Rail foot**: Group/Round lines ("Warm-up 1 of 1", or "Tabata 2 of 2 · Round 3 of 8"), or the Workout name when outside any Group; then the total time left ("44:03 left").
- **Interval list dialog**: every entry, nested under Round headings ("Drill 1 1 of 1"), each with a swatch, name and duration; the one playing now is highlighted.
- **Summary**: the Workout name (eyebrow), the title, and three stat cards: Elapsed, Intervals completed, Work time.

## Sections
- none beyond the regions above

## States
- **Ready / idle**: ink panel, "Press Space or tap to start", "Ready", the Lead-in time ("0:10") (captured: session.png, session.mobile.png).
- **Lead-in**: ink panel, "Get ready", counting down to the first Interval.
- **Running**: panel in the Kind color; control bar shown after a pointer move (captured: session@running.png).
- **Paused**: ink panel, eyebrow "Paused · <Kind>", Restart button added.
- **Resume Lead-in**: after resuming with the 3s Lead-in setting on, eyebrow "Get ready".
- **Final seconds**: the time pulses each second.
- **Interval list open** (captured: session@interval-list.png).
- **Confirm end** and **Confirm restart** dialogs (modal, not captured).
- **Summary, ended early**: "Session ended" (captured: session@summary.png). **Summary, finished**: "Workout complete".
- **Can’t start**: page "<name> can’t start yet" with "Nothing to play yet: add an Interval before starting." and a link "Edit <name>".
- **Not found**: "Workout not found" / "It may have been deleted." / "Back to My Workouts".
- **End-current prompt**: dimmed backdrop with a card "<current> is still under way. End it to start <this>?" (same component as countdown@end-current.png).
- **Auto-pause on sleep**: if the laptop sleeps, the Session pauses at the last known second (shows as Paused).

## Copy
- "Press Space or tap to start", "Ready", "Get ready", "Paused", "Finish", "Up next", "left"
- Kind labels: "Warm-up", "Work", "Rest", "Cool-down"
- Controls: "Previous", "−30 s", "Start", "Pause", "Resume", "+30 s", "Next", "Intervals", "Restart", "End"; nav label "Session controls"
- "Intervals" (list heading), "Close"
- "End this Session?", "End Session", "Keep going"; "Restart the Session from the beginning?", "Restart", "Cancel"
- "Session ended", "Workout complete", "Elapsed", "Intervals completed", "Work time", "Back to My Workouts"
- "<name> can’t start yet", "Nothing to play yet: add an Interval before starting.", "Edit <name>"
- "Workout not found", "It may have been deleted.", "Back to My Workouts"
- "<current> is still under way. End it to start <starting>?", "End <current>", "Back to <current>"
