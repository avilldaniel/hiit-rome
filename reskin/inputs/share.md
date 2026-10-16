---
id: share
name: Shared Workout
route: /share#<encoded workout> (link made by any Share button; the Workout travels in the URL fragment and never reaches a server)
source: src/routes/share/+page.svelte, src/lib/preview/WorkoutPreview.svelte, src/lib/preview/WorkoutOutline.svelte, src/lib/preview/PreviewPage.svelte, src/lib/preview/PreviewMessage.svelte, src/lib/transfer/share-link.ts
viewports: [desktop, mobile]
---

# Shared Workout

Someone opened a link to a Workout another trainer shared: preview it, start it straight away, or add it to their own Workouts.

## Regions
- Same frame as the Sample preview: a **preview card** (left, back link inside) and the **Outline** (right).

## Navigation
- **← My Workouts** → `/`.
- **Start** → `/session/<shared id>`.
- After adding: **Edit your copy** → `/edit/<new id>`.
- Invalid link: **Go to My Workouts** → `/`.

## Actions
- **Start** (primary, large, play icon; hidden when there's nothing to play). Plays the shared Workout without saving it, and it isn't offered back after a reload.
- **Add to My Workouts** (large, plus-box icon): saves a copy with fresh ids. Each tap adds another.

## Fields
- none

## Data displays
- Name (h1), a single chip "Shared with you", Total ("44:05"), Timeline strip, and the read-only Outline (as in library-sample.md). No description.

## Sections
- Preview card; "Outline".

## States
- **Reading the link**: blank.
- **Loaded** (captured: share.png, share.mobile.png).
- **Added**: "Added “<name>” to My Workouts. Edit your copy".
- **Add failed**: "It couldn’t be added. Try again."
- **Invalid or damaged link**: message card "This link can’t be opened" + alert line with the reason ("This link is damaged or incomplete. Ask for it to be shared again.", "This link was made by a newer version of hiit-rome. Reload the app to update it, then open the link again.", or "This link couldn’t be opened.") + "Go to My Workouts" (captured: share@invalid-link.png).

## Copy
- "← My Workouts", "Shared with you", "Total", "Start", "Add to My Workouts", "Outline"
- "Added “<name>” to My Workouts.", "Edit your copy", "It couldn’t be added. Try again."
- "This link can’t be opened", "This link couldn’t be opened.", "This link is damaged or incomplete. Ask for it to be shared again.", "This link was made by a newer version of hiit-rome. Reload the app to update it, then open the link again.", "Go to My Workouts"
- Page title fallback "Shared Workout"
