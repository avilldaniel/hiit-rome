# Device-local data, no backend

All Workouts, Settings, Presets and in-progress Session state live only in the browser's IndexedDB on the device that created them. There are no accounts, no server, and no cloud sync. Workouts move between devices through share links: the Workout is compressed into the URL fragment, which never reaches a server. Backup files (a JSON export and import of everything) act as the safety net, and the app requests persistent storage to reduce eviction risk. We chose this because v1 serves a small circle of users, mostly on one TV-connected device. A backend would add hosting, auth and privacy work for little benefit at this stage.

## Considered Options

- **Cloud sync with accounts.** Rejected for v1 because it is the bulk of the work for a convenience that share links mostly cover.

## Consequences

- If a browser clears its data and the user has no backup file, their Workouts are lost. Settings shows "last backed up" to nudge users.
- Adding accounts later means migrating each device's local data into the cloud on first sign-in. Keep the stored data schema versioned from day one.
- Phone-as-remote and Spotify music (see `docs/roadmap.md`) both stay possible. The remote is the first feature that will force a real-time sync channel.
