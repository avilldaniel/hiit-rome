# 09 — Session resilience

**What to build:** Sessions survive the real world:
- If the laptop sleeps, the Session auto-pauses at the last known second.
- If the page reloads or crashes, the app offers "Resume where you left off?" and comes back paused at the same position.
- The screen stays awake, F toggles fullscreen, and Cues keep firing while another app or tab is in front.

Reference: spec "Session engine" (sleep detection, serialization), "Workout store" (saved Session), "Platform adapters", "Running a Session: resilience" stories.

**Blocked by:** 02 — Session controls and summary; 04 — Spoken and beep Cues; 05 — My Workouts: storage and home

**Status:** ready-for-agent

- [ ] Engine: a tick more than 10 s after the previous one auto-pauses at the previous tick's position, without counting the gap; tested.
- [ ] Engine state serializes to and restores from plain data; a restored Session is always paused; tested.
- [ ] The store saves the active Session on every state-changing action and at least every 5 s while running, and clears it on complete, end or discard. A saved Session older than 12 hours is discarded instead of offered. Tested at seam B.
- [ ] On app open with a saved Session, the app prompts "Resume where you left off?" with Resume (paused, at the exact position) or Discard.
- [ ] The screen wake lock is held while a Session is active and re-acquired when the tab becomes visible again. F toggles fullscreen.
- [ ] A background keepalive (near-silent Web Audio) runs while a Session is active. Verify manually in Chrome, Safari and Firefox that Cues continue with another tab in front, and record the results in this ticket.
- [ ] A Playwright smoke test reloads the page mid-Session and checks that the recovery prompt appears and that resuming shows the same Interval, paused.
