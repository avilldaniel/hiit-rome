# 12 — Countdown

**What to build:** A standalone Countdown: five one-tap Presets (default 1, 3, 5, 10 and 15 min, editable in Settings) or a custom duration. It shows the same large-digit display in one palette color (default blue) with pause/resume, ±30 s, restart and end. Final-seconds beeps and an optional "1 minute remaining" Warning play, then a chime three times at zero and a flashing "TIME" until dismissed. Only one Session or Countdown can be active at a time.

Reference: spec "Session engine" (Countdown is a one-entry Timeline), "Cue rules" (Countdown), "Countdown" stories.

**Blocked by:** 02 — Session controls and summary; 04 — Spoken and beep Cues; 08 — Settings and per-Workout overrides

**Status:** resolved (branch v1, commit PENDING)

- [x] The Countdown runs on the Session engine as a one-entry Timeline; no separate engine. Its end behavior (chime ×3, then a TIME state until dismissed) is tested.
- [x] The Warning ("1 minute remaining") is default on and only applies when the duration is over 1 minute; tested.
- [x] The Countdown screen from home shows the 5 Preset buttons and custom entry. The display uses the configured palette color (default Rest blue) with the paired text color.
- [x] Controls: pause/resume, ±30 s, restart and end; next and previous don't apply.
- [x] Presets and the Countdown color are editable in Settings and persisted.
- [x] Starting a Session or Countdown while another is active asks to end the current one first.
- [x] A running Countdown survives reloads and sleep like a Session, once ticket 09 has landed (tested there if 09 is done first; otherwise add the test here).
- [x] A Playwright smoke test: start a Preset, use a controlled clock to reach zero, see TIME, dismiss.

**Agent (implementation, ticket 12):** All items above are done and tested. (The three Sample items above were copied from ticket 11 by mistake and are not part of this ticket.) Engine (Seam A): `countdown.test.ts`. Store (Seam B): Presets, Countdown settings, a saved Countdown. Playwright (`e2e/countdown.test.ts`): Preset → TIME → dismiss, custom ±30 s/pause/end, reload recovery, and the one-active-timer prompt in both directions. Decisions worth a look:
- **Engine:** `createCountdown` is a Session over a one-entry Timeline with no Lead-in and no resume Lead-in, so resuming from pause counts again at once. Its Cue settings are `{ countdown: true, warning }`. The view adds `timeUp`.
- **Cues:** beeps at 3, 2 and 1 s, with no tone at 0. Then three chimes 0.75 s apart, close enough that the player gets all three at zero and they still ring if TIME is dismissed at once. The Warning applies when the adjusted length is over 1 minute, so +30 s on a 1:00 Countdown turns it on.
- **Settings:** `Settings.countdown = { color, warning }`. The color can be Blue (default), Red, Yellow or Green. Navy is left out because it means "paused". The Presets are their own record, ready for backup in ticket 14.
- **One active timer:** "active" means the single saved Session in the store. Opening a Session, or starting a Countdown, while one exists asks "X is still under way. End it to start Y?", with the choices End X and Back to X. Going back resumes it, paused.
- **Restart** works only from pause, as in a Session. **End** (confirmed) goes straight back to the Preset picker, with no summary. TIME is dismissed with a tap, Space, Enter or Esc, or the Dismiss button, and returns to the picker. A reload while TIME is showing drops back to the picker, as a finished Session does.
- **Refactor:** the Session screen's ticking, saving, audio, wake lock and keepalive moved into `SessionRunner` (`runner.svelte.ts`), and tap and swipe handling into `TouchControls`, so the Countdown screen shares them. A screen left mid-run now saves on the way out, so going back resumes at the exact second.
- GLOSSARY "Countdown" now says it plays as a Session of a single Interval.
