# 14 — Backup export and import

**What to build:** The trainer exports everything (Workouts, Presets, Settings) to one backup file and can import it on any device. Import merges and never overwrites Workouts. Settings shows when they last backed up.

Reference: spec "Transfer" (backup), ADR 0001 consequences.

**Blocked by:** 08 — Settings and per-Workout overrides

**Status:** resolved (branch v1, commit 4a3755b)

- [x] Export produces one JSON file with schema version, export date, all Workouts, Presets and Settings, and updates the last-backup timestamp.
- [x] Import validates, migrates older schema versions, and merges:
  - Workouts with the same id and identical content are skipped.
  - Other Workouts are added with a new id, with " (2)", " (3)" and so on appended on a name clash.
  - Settings and Presets are replaced only after explicit confirmation.
- [x] Tests at seam B: round trip, every merge rule, and migration from a fake older version.
- [x] Settings shows "Last backed up: <date | never>" with Export and Import actions.
- [x] Invalid files show a friendly error and change nothing.
