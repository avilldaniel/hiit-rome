# 09 — Session resilience

**What to build:** Sessions survive the real world:
- If the laptop sleeps, the Session auto-pauses at the last known second.
- If the page reloads or crashes, the app offers "Resume where you left off?" and comes back paused at the same position.
- The screen stays awake, F toggles fullscreen, and Cues keep firing while another app or tab is in front.

Reference: spec "Session engine" (sleep detection, serialization), "Workout store" (saved Session), "Platform adapters", "Running a Session: resilience" stories.

**Blocked by:** 02 — Session controls and summary; 04 — Spoken and beep Cues; 05 — My Workouts: storage and home

**Status:** ready-for-human (code done on branch v1; only the manual keepalive check in Chrome, Safari and Firefox remains)

- [x] Engine: a tick more than 10 s after the previous one auto-pauses at the previous tick's position, without counting the gap; tested.
- [x] Engine state serializes to and restores from plain data; a restored Session is always paused; tested.
- [x] The store saves the active Session on every state-changing action and at least every 5 s while running, and clears it on complete, end or discard. A saved Session older than 12 hours is discarded instead of offered. Tested at seam B.
- [x] On app open with a saved Session, the app prompts "Resume where you left off?" with Resume (paused, at the exact position) or Discard.
- [x] The screen wake lock is held while a Session is active and re-acquired when the tab becomes visible again. F toggles fullscreen.
- [ ] A background keepalive (near-silent Web Audio) runs while a Session is active. Verify manually in Chrome, Safari and Firefox that Cues continue with another tab in front, and record the results in this ticket.
- [x] A Playwright smoke test reloads the page mid-Session and checks that the recovery prompt appears and that resuming shows the same Interval, paused.

## Comments

**Agent (implementation):** All code items are done and tested: engine Seam A, store Seam B, wake lock through a fake host, and Playwright for reload recovery, discard, sleep and end-clears. Notes:
- The Session screen now uses `Date.now()` as its clock. `performance.now()` may stop while macOS sleeps, which would hide the gap from sleep detection.
- A paused Session is saved on every change but not every 5 s, so the 12-hour expiry counts from when it stopped.
- If the saved Session's Workout has been deleted, resuming clears the saved Session.
- **Manual check still needed.** Start a Session, switch to another tab for more than 5 minutes (Chrome throttles hidden tabs hard after that), and confirm the Cues stay on time. Do this in Chrome, Safari and Firefox and record the results here. If a browser still throttles, ticks more than 10 s apart will auto-pause the Session in the background.
