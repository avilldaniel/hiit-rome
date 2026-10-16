---
id: library
name: Library
route: /library
source: src/routes/library/+page.svelte, src/lib/library/samples.ts
viewports: [desktop, mobile]
---

# Library

Browse ready-made Samples by level, and open one to preview it.

## Regions
- **Header**: back link, "Library" (h1), an intro line.
- **Main**: three level sections, each an h2 with a three-column card grid under it (fewer columns on narrow screens).

## Navigation
- **← My Workouts** → `/`.
- Each Sample card is a link → `/library/<sample id>` (e.g. `/library/sample-double-tabata`).

## Actions
- The Sample card links.

## Fields
- none

## Data displays
- **Sample cards** (11 in total: Beginner 4, Intermediate 3, Advanced 4). Each has a Timeline strip, the name, the total duration (right), two chips (Level, Style), and a blurb clamped to two lines. Sample: "Double Tabata · 15:40 · Intermediate · Tabata · Two Tabatas of squat jumps with a minute between."
- Sample names: First Steps HIIT, Low-Impact Tabata, Bodyweight Circuit, EMOM Starter, Classic 40/20, Double Tabata, Full-Body Circuit, Sprint Repeats, Burpee & Climber Tabatas, Upper/Lower Circuit, EMOM 20.

## Sections
- Intro (free copy): "Ready-made Samples to start as they are, or add to your Workouts and make your own."
- "Beginner", "Intermediate", "Advanced"

## States
- Static: one state only (captured: library.png, library.mobile.png).

## Copy
- "← My Workouts", "Library", "Beginner", "Intermediate", "Advanced"
- Style chips: "HIIT", "Tabata", "Circuit", "EMOM"
- Sample names and blurbs come from data (locked).
- Intro (free copy).
