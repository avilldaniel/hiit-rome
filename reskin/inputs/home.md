---
id: home
name: My Workouts
route: /
source: src/routes/+page.svelte, src/lib/home/WorkoutCard.svelte, src/lib/transfer/ShareButton.svelte, src/lib/ui/Toast.svelte, src/lib/platform/UpdateBanner.svelte (via src/routes/+layout.svelte)
viewports: [desktop, mobile]
---

# My Workouts

The trainer's home base: find a saved Workout and start it, or manage it (edit, favorite, duplicate, share, delete). It's also the only screen with the app's main nav.

## Regions
- **Sidebar** (left, sticky, full height, `clamp(240px, 15.6vw, 300px)` wide, white with a right border). From top to bottom: brand (four Kind-colored bars + "hiit-rome"), the primary "New Workout" button, then the vertical nav.
- **Main** (gray ground): a head row (title "My Workouts" + count on the left; Search and Sort by on the right), then a grid of Workout cards. Three columns at full size, fewer once a card would drop under 400px.
- **Toast** (floats bottom center): Undo after a delete.
- **Update banner** (floats bottom right, every screen except Session/Countdown): "A new version of the app is ready."
- At ≤900px the sidebar stacks on top (not sticky) with a wrapping row of nav links, Search goes full width, and the cards collapse to one column.

## Navigation
- Sidebar nav (`aria-label="Create"`): **My Workouts** (`/`, current), **Wizard** (`/wizard`), **Library** (`/library`), **Countdown** (`/countdown`), **Settings** (`/settings`).
- Card "Start" → `/session/<id>`; card Edit (icon) → `/edit/<id>`.

## Actions
- **New Workout** (primary, large, plus icon): stores a blank "Untitled Workout" and opens it in the editor.
- Per Workout card:
  - **Start** (primary, play icon; accessible name "Start <name>"): opens the Session.
  - **Favorite** (ghost, star icon, toggle with `aria-pressed`): marks/unmarks it as a favorite.
  - **Edit** (icon-only, pencil; "Edit <name>", tooltip "Edit"): opens the editor.
  - **Duplicate** (icon-only, copy; "Duplicate <name>"): adds a copy.
  - **Share** (icon-only, share; "Share <name>", disabled until the link is ready): uses the Web Share sheet when available, otherwise copies the link and briefly shows "Link copied" above the button, or "Couldn’t share it. Try again." on failure.
  - **Delete** (icon-only danger, trash; "Delete <name>"): deletes at once and shows the Undo toast for 8s.
- Toast **Undo**: restores the deleted Workout.
- Update banner **Later** (ghost: hides the banner) and **Reload** (primary: switches to the new version).

## Fields
- **Search Workouts** (visually hidden label): `type="search"`, placeholder "Search", search icon inside. Filters the list live by name.
- **Sort by** (inline label, select): Recently used (default) / Name / Duration.

## Data displays
- **Count line** under the title: "58 Workouts on this device" (singular "1 Workout"). Always counts every Workout, whatever the search.
- **Workout card grid**: each card is an `article` with:
  - a thin Timeline strip: one segment per Interval, its width the Interval's share of the total, colored by Kind;
  - name (h2, up to two lines, then clamped);
  - Interval count ("32 Intervals");
  - total duration, large and right-aligned ("44:05");
  - the action row.
  - Typical count: 58 with the demo seed. Sample row: "Lean Burn 11/12 · 32 Intervals · 44:05".
- Favorite state shows as the pressed star button.

## Sections
- none beyond the regions above

## States
- **Loading**: nothing renders under the head until the list loads (no count line yet).
- **Loaded with Workouts**: the default view (captured: home.png, home.mobile.png).
- **No search match**: "No Workouts match “zzz”." in large muted text (captured: home@no-match.png).
- **Empty device**: "No Workouts yet." (same style, not captured: it needs every Workout deleted).
- **Load error**: "Your Workouts couldn’t be loaded. Try reloading the page." (`role="alert"`, not captured).
- **Deleted, undo available**: toast "Deleted “<name>”" + Undo, for 8s (captured: home@undo-toast.png).
- **Share outcome notice**: "Link copied" or "Couldn’t share it. Try again." above the share icon for 3s (not captured).
- **Update available**: the bottom-right banner "A new version of the app is ready." with Later and Reload (not captured: needs a newer service worker waiting).
- **Resume prompt**: on a full load with an unfinished Session, the whole app is replaced by the Resume prompt (see resume.md).

## Copy
- Brand: "hiit-rome"; page title "hiit-rome"
- "New Workout", "My Workouts", "Wizard", "Library", "Countdown", "Settings"
- "My Workouts" (h1); "<n> Workouts on this device" / "1 Workout on this device"
- "Search Workouts" (label), "Search" (placeholder), "Sort by", "Recently used", "Name", "Duration"
- Card: "<n> Intervals" / "1 Interval", "Start", "Favorite"; tooltips "Edit", "Duplicate", "Share", "Delete"
- "No Workouts match “<search>”.", "No Workouts yet.", "Your Workouts couldn’t be loaded. Try reloading the page."
- "Deleted “<name>”", "Undo"
- "Link copied", "Couldn’t share it. Try again."
- "A new version of the app is ready.", "Later", "Reload"
