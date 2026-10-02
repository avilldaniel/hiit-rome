# hiit-rome

A big-screen interval timer for guiding workouts, modelled on the Seconds Pro app. Users build Workouts and run them as Sessions on a display readable from across the room.

## Language

**Workout**:
A saved, named definition of an ordered structure of intervals that a user builds and can run repeatedly.
_Avoid_: Timer, routine, program

**Interval**:
The smallest timed part of a Workout, with a name, duration and color; the only thing that actually counts down.
_Avoid_: Segment, step, exercise

**Kind**:
The role an Interval plays in a Workout — one of Warm-up, Work, Rest, or Cool-down — which sets its default color and how it is announced.
_Avoid_: Type, category, phase

**Group**:
An ordered sequence of Intervals and/or nested Groups, played a set number of times, with an optional name (e.g. "Tabata").
_Avoid_: Set, block, circuit, superset

**Round**:
One pass through a Group; "Round 3 of 8" means the third pass.
_Avoid_: Set, rep, lap, cycle

**Wizard**:
A short form for one style of workout (e.g. Tabata) that generates a new, independent Workout from a few parameters.
_Avoid_: Template, builder, generator

**Sample**:
A ready-made Workout in the built-in Library that a user can start as it is, or copy into their own Workouts to change.
_Avoid_: Preset, template, example

**Library**:
The built-in, read-only collection of Samples shipped with the app.
_Avoid_: Repository, catalog, store

**Session**:
One playthrough of a Workout, from start to finish (or abandonment), including its current position and paused state.
_Avoid_: Run, timer, playback

**Lead-in**:
The short "get ready" countdown played before a Session's first Interval (its length set per Workout, possibly zero), and briefly again when a Session resumes from pause.
_Avoid_: Prep, pre-countdown, warm-up

**Cue**:
An audible signal played at a defined moment in a Session — a spoken announcement, beep, or chime.
_Avoid_: Alert, sound, notification

**Warning**:
A spoken Cue announcing the upcoming Interval, played a set number of seconds before the current Interval ends.
_Avoid_: Heads-up, pre-alert, reminder

**Countdown**:
A standalone single-duration timing tool, independent of any Workout.
_Avoid_: Timer, quick timer

**Preset**:
One of the five user-editable durations offered as a one-tap start for a Countdown.
_Avoid_: Favorite, shortcut, quick start
