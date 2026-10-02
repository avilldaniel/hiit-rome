# 05 — My Workouts: storage and home

**What to build:** Workouts persist on the device, and the app opens to a home screen. It shows My Workouts as cards (name, total duration, a color strip previewing the Interval sequence), each with a one-click Start, plus search, sorting and Favorites. The demo Workout from 01 is replaced by real stored Workouts; seed one example on first launch so the list isn't empty.

Reference: spec "Workout store", "Home and organization" stories, ADR 0001.

**Blocked by:** 01 — Tracer bullet

**Status:** resolved (branch v1, commit 911415e)

- [x] Workout store over IndexedDB: CRUD, favorite flag, and a last-used timestamp (updated on Session start). The stored data carries a schema version from day one, with a migration hook run on open.
- [x] The store requests persistent storage on first launch.
- [x] Store tests run against an in-memory IndexedDB fake through the store's public interface (seam B).
- [x] Home screen: My Workouts cards with name, total duration and color strip; one-click Start; case-insensitive name search; sort by recent, name or duration; Favorites pinned first.
- [x] Card actions: favorite or unfavorite, duplicate, and delete with Undo. Edit links to the editor once ticket 06 lands.
- [x] Home also shows placeholders for New Workout, Wizard, Library and Countdown, filled in by later tickets.
- [x] A Playwright smoke test: home → Start on a card → Session screen is shown.

## Comments

- Workout bookkeeping (favorite, createdAt, lastUsedAt) lives on `StoredWorkout`, which extends `Workout`, rather than on `Workout` itself as spec module 1 says, so engine code and share links never carry it.
- Delete with Undo offers Undo for the most recent deletion only; an earlier one becomes final when another Workout is deleted.
- Edit stays disabled until ticket 06.
