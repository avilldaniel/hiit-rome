# 15 — Installable offline app

**What to build:** The app can be installed to the home screen or dock and works fully offline once loaded, so flaky gym Wi-Fi never stops a class.

Reference: spec "Architecture" (`@vite-pwa/sveltekit`), "App and platform" stories.

**Blocked by:** 01 — Tracer bullet

**Status:** resolved (branch v1, commit 8ba4f06)

- [x] Web app manifest with name, icons, theme color (neutral navy), and display set to standalone or fullscreen.
- [x] The app shell and all static assets are precached; the app loads and runs a Workout with the network disabled.
- [x] An update flow: when a new version is available, prompt to reload, never mid-Session.
- [x] A Playwright smoke test (or a documented manual check if the service worker can't run in the test environment): load once, go offline, reload, and the app still works.

## Comments

- `@vite-pwa/sveltekit` supports SvelteKit 1–2 only; the app is on Kit 3, so it uses Kit's built-in service worker (`src/service-worker/`) and a hand-written `static/manifest.webmanifest`. Recorded as an amendment to ADR 0002.
- The update banner is hidden on Session screens (`/session/…`, `/countdown`); a Session left under way while browsing elsewhere still gets the banner, and reloading offers it back through recovery.
- Smoke test: `e2e/offline.test.ts`.
