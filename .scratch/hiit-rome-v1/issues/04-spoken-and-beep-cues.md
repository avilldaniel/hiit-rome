# 04 — Spoken and beep Cues

**What to build:** Sessions talk. The device voice announces each Interval and gives a Warning before it ends ("Next: Burpees"). Beeps count down the final seconds, and "Workout complete" plays with a chime. Cues keep working when ticks are throttled, without playing stale sounds late.

Reference: spec "Cue rules", "Platform adapters" (Cue player).

**Blocked by:** 01 — Tracer bullet

**Status:** resolved (branch `v1`, commit 69a6a61, review fixes f6b5536)

- [x] Engine Cue rules:
  - Interval start announces the name (an unnamed Rest says "Rest").
  - The Warning fires N s before the end (default 10) and says "Next: <name>"; on the final Interval it says "Last N seconds".
  - The Warning merges into the start announcement when N ≥ the duration ("Rest. Next: Burpees.").
  - Final-seconds beeps at 3, 2 and 1 s, with a distinct tone at 0.
  - Optional "Halfway" for Intervals of 30 s or more (default off).
  - Completion speech plus a chime.
  - Lead-in beeps.
- [x] Every tick returns the Cues due since the previous tick, so throttled ticks still emit them; Cues more than 2 s stale are dropped. Tested with a fake clock.
- [x] Cue player adapter: speech via the Web Speech API and tones and chimes via Web Audio, with audio enabled on the first click or keypress (Start). Final-seconds beeps are scheduled ahead on the audio clock.
- [x] A recording fake of the Cue player is available for unit and Playwright tests.
- [x] Cue settings use hard-coded global defaults until ticket 08, behind a single "effective settings" input to the engine.
- [x] A Playwright smoke test (with the recording fake) runs a short Workout and asserts the expected announcements in order.

## Comments

- Code review (standards + spec) ran against 69a6a61. Fixed in f6b5536: a control that changed nothing (e.g. +30 s in the Lead-in) cancelled Cues told ahead that were then never reported again; speech now queues instead of cutting itself off (a Warning soon after the start truncated the name), and a pause or skip clears it; speech is primed inside the unlocking gesture (Safari); lookahead raised from 0.5 s to 1.5 s to outlast background-tab timer throttling; "sound" renamed per the glossary (`Cue`, `DueCue`), `cueSettings`.
- Decisions where the spec was silent: a merged Warning on the final Interval announces just its name; the end of the Workout plays the chime and "Workout complete" instead of the tone at 0; the Lead-in ends with the tone at 0, the resume Lead-in only beeps; Halfway is left out when the Warning comes at or before the halfway point; the tone at 0 plays only when the clock runs into an end, not when a skip or jump lands on a start (which is announced); final-seconds beeps never sound over an Interval's start (a 3 s Interval gets two); all Cues are reported up to 1.5 s ahead with their delay; a jump while paused is announced on resume; Warning 0 turns it off.
- Browser tests swap in the recording fake by setting `window.__hiitCueLog = []` before the app loads.
- Deferred: the Cue tick cadence (250 ms, in SessionScreen) and the engine's lookahead are tuned together; the Ticker adapter (ticket 09) is the natural home. Real-device listening (voice, tone levels, Safari/Firefox) not yet checked by ear.

