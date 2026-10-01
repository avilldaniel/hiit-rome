# 15 — Installable offline app

**What to build:** The app can be installed to the home screen or dock and works fully offline once loaded, so flaky gym Wi-Fi never stops a class.

Reference: spec "Architecture" (`@vite-pwa/sveltekit`), "App and platform" stories.

**Blocked by:** 01 — Tracer bullet

**Status:** ready-for-agent

- [ ] Web app manifest with name, icons, theme color (neutral navy), and display set to standalone or fullscreen.
- [ ] The app shell and all static assets are precached; the app loads and runs a Workout with the network disabled.
- [ ] An update flow: when a new version is available, prompt to reload, never mid-Session.
- [ ] A Playwright smoke test (or a documented manual check if the service worker can't run in the test environment): load once, go offline, reload, and the app still works.
