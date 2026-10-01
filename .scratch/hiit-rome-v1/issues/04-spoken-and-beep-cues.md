# 04 — Spoken and beep Cues

**What to build:** Sessions talk. The device voice announces each Interval and gives a Warning before it ends ("Next: Burpees"). Beeps count down the final seconds, and "Workout complete" plays with a chime. Cues keep working when ticks are throttled, without playing stale sounds late.

Reference: spec "Cue rules", "Platform adapters" (Cue player).

**Blocked by:** 01 — Tracer bullet

**Status:** ready-for-agent

- [ ] Engine Cue rules:
  - Interval start announces the name (an unnamed Rest says "Rest").
  - The Warning fires N s before the end (default 10) and says "Next: <name>"; on the final Interval it says "Last N seconds".
  - The Warning merges into the start announcement when N ≥ the duration ("Rest. Next: Burpees.").
  - Final-seconds beeps at 3, 2 and 1 s, with a distinct tone at 0.
  - Optional "Halfway" for Intervals of 30 s or more (default off).
  - Completion speech plus a chime.
  - Lead-in beeps.
- [ ] Every tick returns the Cues due since the previous tick, so throttled ticks still emit them; Cues more than 2 s stale are dropped. Tested with a fake clock.
- [ ] Cue player adapter: speech via the Web Speech API and tones and chimes via Web Audio, with audio enabled on the first click or keypress (Start). Final-seconds beeps are scheduled ahead on the audio clock.
- [ ] A recording fake of the Cue player is available for unit and Playwright tests.
- [ ] Cue settings use hard-coded global defaults until ticket 08, behind a single "effective settings" input to the engine.
- [ ] A Playwright smoke test (with the recording fake) runs a short Workout and asserts the expected announcements in order.
