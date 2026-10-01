# 01 — Tracer bullet: a Workout runs on the Session screen

**What to build:** A trainer opens the app and sees a built-in demo Workout ready on the Session screen (variant B "Side rail" from the prototype). Pressing Space plays the Lead-in, then runs the Intervals. The whole screen takes each Interval's color, the "Up next" rail updates, and Space pauses and resumes. At the end the Session completes.

This slice sets up the project and the patterns everything else follows:
- SvelteKit static SPA (ADR 0002)
- the framework-free Workout model, Timeline builder and Session engine
- palette tokens
- all three test seams (engine via Vitest, store seam ready for later, browser smoke via Playwright)

Reference: spec sections "Workout model", "Timeline builder", "Session engine", "Session screen layout", "Colors". The prototype (`prototypes/session-screen.prototype.html` on branch `prototype/session-screen`) shows the target layout; rewrite it properly, don't copy it.

**Blocked by:** None — can start immediately

**Status:** ready-for-agent

- [ ] Project scaffold: SvelteKit (Svelte 5, TypeScript) with `adapter-static` in SPA mode and no server files. Vitest and Playwright are configured, and one command each runs the dev server, unit tests and browser tests.
- [ ] Workout model types (Workout, Group, Interval, Kind) with validation limits (duration 1 s–99:59, Rounds 1–99). The engine modules have no Svelte imports.
- [ ] The Timeline builder flattens nested Groups. Each entry carries its start offset, resolved colors and position path. "Skip last rest" applies recursively; tests cover the 4-Tabata example and its total duration.
- [ ] The Session engine covers start → Lead-in → running → completed, plus pause and resume. It is timestamp-based (no tick counting), driven by timestamped actions, never reads the clock, and is tested with a fake clock.
- [ ] The engine view exposes status, current entry, next five upcoming entries, remaining and elapsed time, total remaining, progress, header labels (named Groups as "Name X of Y", an unnamed innermost Group as "Round X of Y", unnamed outer Groups omitted), colors, and the Kind label (hidden when the name equals the Kind).
- [ ] Palette tokens live in one place: Kind colors, neutral navy, and paired text colors. An automated test asserts at least 3:1 contrast for every pair.
- [ ] The Session screen matches variant B. The main area shows the Kind label, name, digits (tabular numbers, system sans) and progress bar in the Interval's color. A navy rail shows "UP NEXT" with five items (first largest and wrapping, the rest truncating), the Round header and time left. During the final Interval the rail shows a single "Finish" row. In portrait the rail stacks below.
- [ ] Lead-in and paused states use the neutral navy screen. The final-3-seconds pulse falls back to a flash under reduced motion.
- [ ] A Playwright smoke test controls the page clock, presses Space, and asserts that the background changes from navy (Lead-in) to the first Interval's color and that the Session reaches completion.
