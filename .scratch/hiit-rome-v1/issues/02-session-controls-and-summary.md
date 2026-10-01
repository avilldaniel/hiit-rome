# 02 — Session controls and summary

**What to build:** During a Session, the trainer can control everything from the keyboard or by touch:
- next and previous (the music-player 3-second rule)
- ±30 s on the current Interval (this Session only)
- end, with confirmation
- restart from the pause screen, with confirmation
- a short resume Lead-in after a pause
- a summary at the end

Reference: spec "Session engine", "Interaction specifics".

**Blocked by:** 01 — Tracer bullet

**Status:** ready-for-agent

- [ ] Engine: next (on the final entry, completes the Session); previous (restarts the Interval if more than 3 s have elapsed, else goes back; on the first entry, restarts it); adjust ±30 s stored as per-entry Session offsets (−30 s with less than 30 s left ends the Interval); restart; end. All are tested with a fake clock.
- [ ] Resume Lead-in: 3 s on the navy screen when resuming from pause, default on (hard-coded until ticket 08).
- [ ] Keyboard: Space start/pause/resume, → next, ← previous, ↑ +30 s, ↓ −30 s, R restart (pause screen, confirmed), Esc end (confirmed).
- [ ] Touch: tap anywhere to pause or resume, swipe for next or previous, and a control bar with every action that hides after 3 s of inactivity.
- [ ] Summary screen on completion or end: elapsed time, Intervals completed, total Work time. Nothing is persisted.
- [ ] Total remaining time reflects ±30 s adjustments.
- [ ] A Playwright smoke test drives next, previous and ±30 s via the keyboard and asserts on the displayed Interval and time.
