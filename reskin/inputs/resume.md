---
id: resume
name: Resume prompt
route: any route, on a full page load while a Session or Countdown is saved as under way (rendered by src/routes/+layout.svelte before the page itself)
source: src/routes/+layout.svelte, src/lib/session/RecoveryPrompt.svelte, src/lib/session/recovery.ts
viewports: [desktop, mobile]
---

# Resume prompt

After a reload, crash or reopen, offer to pick up the unfinished Session or Countdown exactly where it stopped, before anything else shows.

## Regions
- One centered white card on the gray ground. TV-scaled sizes, readable from across the room.

## Navigation
- **Resume** → that Session's screen (`/session/<id>`) or `/countdown`, paused at the saved second.
- **Discard** → the page that was loaded.

## Actions
- **Discard** (prompt size): forgets the saved Session.
- **Resume** (primary, prompt size, focused so Enter resumes).

## Fields
- none

## Data displays
- The Workout name with a swatch in the Kind color it comes back to (ink in the Lead-in).
- Position: "<Interval name> · <m:ss> left", or "Lead-in".

## Sections
- none

## States
- **Prompt** (captured: resume.png, resume.mobile.png; this capture is in the Lead-in, so it shows "Lead-in" and an ink swatch).
- **Checking**: nothing renders until the saved Session has been read.

## Copy
- "Resume where you left off?", "Lead-in", "<name> · <m:ss> left", "Discard", "Resume"
