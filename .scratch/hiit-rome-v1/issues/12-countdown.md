# 12 — Countdown

**What to build:** A standalone Countdown: five one-tap Presets (default 1, 3, 5, 10 and 15 min, editable in Settings) or a custom duration. It shows the same large-digit display in one palette color (default blue) with pause/resume, ±30 s, restart and end. Final-seconds beeps and an optional "1 minute remaining" Warning play, then a chime three times at zero and a flashing "TIME" until dismissed. Only one Session or Countdown can be active at a time.

Reference: spec "Session engine" (Countdown is a one-entry Timeline), "Cue rules" (Countdown), "Countdown" stories.

**Blocked by:** 02 — Session controls and summary; 04 — Spoken and beep Cues; 08 — Settings and per-Workout overrides

**Status:** ready-for-agent

- [ ] The Countdown runs on the Session engine as a one-entry Timeline; no separate engine. Its end behavior (chime ×3, then a TIME state until dismissed) is tested.
- [ ] The Warning ("1 minute remaining") is default on and only applies when the duration is over 1 minute; tested.
- [ ] The Countdown screen from home shows the 5 Preset buttons and custom entry. The display uses the configured palette color (default Rest blue) with the paired text color.
- [ ] Controls: pause/resume, ±30 s, restart and end; next and previous don't apply.
- [ ] Presets and the Countdown color are editable in Settings and persisted.
- [ ] Starting a Session or Countdown while another is active asks to end the current one first.
- [ ] A running Countdown survives reloads and sleep like a Session, once ticket 09 has landed (tested there if 09 is done first; otherwise add the test here).
- [ ] A Playwright smoke test: start a Preset, use a controlled clock to reach zero, see TIME, dismiss.
