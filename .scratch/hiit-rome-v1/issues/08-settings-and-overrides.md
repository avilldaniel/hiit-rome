# 08 — Settings and per-Workout overrides

**What to build:** The trainer configures audio once in Settings: voice, global Cue defaults and the resume Lead-in toggle. They can override per Workout, e.g. a Tabata with the Warning at 5 s, along with that Workout's Lead-in length. Sessions use the effective settings (defaults overlaid with overrides). Settings also hosts the Countdown Presets editor, built in ticket 12.

Reference: spec "Cue rules" (effective settings), "Audio Cues" stories.

**Blocked by:** 04 — Spoken and beep Cues; 06 — Workout editor: build and edit

**Status:** ready-for-agent

- [ ] Settings persisted in the store: voice (chosen from those on the device), Cue defaults (announce on/off, Warning on/off and seconds, final-seconds beeps on/off, Halfway on/off, completion on/off), and the resume Lead-in toggle.
- [ ] Settings page reachable from home, including a "test voice" button.
- [ ] A per-Workout settings panel in the editor sets Lead-in length (default 10 s, 0 allowed) and optional Cue overrides; an unset override inherits the default.
- [ ] Sessions start with effective settings = defaults overlaid with overrides. Engine tests cover the overlay and, for example, the Warning at 5 s.
- [ ] The hard-coded defaults from tickets 02 and 04 are removed.
