---
id: wizard
name: Wizards
route: /wizard
source: src/routes/wizard/+page.svelte, src/lib/wizards/registry.ts
viewports: [desktop, mobile]
---

# Wizards

Pick a Workout style and fill in a short form, instead of building the Workout by hand.

## Regions
- **Header**: back link, "Wizards" (h1).
- **Main**: an intro line, then a row of four cards (four columns at 1280, wrapping on narrow screens).

## Navigation
- **← My Workouts** → `/`.
- Each card is a link: HIIT → `/wizard/hiit`, Tabata → `/wizard/tabata`, Circuit → `/wizard/circuit`, EMOM → `/wizard/emom`.

## Actions
- The four card links (above).

## Fields
- none

## Data displays
- **Wizard cards** (4): a Timeline strip of the Workout the Wizard makes by default, the title (h2), and a blurb. Sample: "Tabata · 20 s on, 10 s off, 8 Rounds: one Tabata, or several in a row."

## Sections
- Intro (free copy): "Fill in a short form and get a Workout of your own, ready to start or fine-tune."

## States
- Static: one state only (captured: wizard.png, wizard.mobile.png).

## Copy
- "← My Workouts", "Wizards"
- "HIIT": "Work and Rest, repeated for a number of Rounds."
- "Tabata": "20 s on, 10 s off, 8 Rounds: one Tabata, or several in a row."
- "Circuit": "A list of exercises, each its own Interval, with Rest between, for a number of Rounds."
- "EMOM": "Every minute on the minute: one exercise per minute, for a number of Rounds."
- Intro (free copy).
