# SvelteKit as a static SPA, with a framework-free timer engine

The app is built with SvelteKit (Svelte 5) using `adapter-static` in SPA mode. There is no server-side rendering and no server routes; it deploys as plain static files and is installable as a PWA via SvelteKit's own service worker (see Amendment). React + Vite was the default alternative and was seriously considered. Svelte was chosen for its lighter runtime and its strength with the single-screen, animation-heavy Session display. SvelteKit's server features are deliberately unused, to stay consistent with ADR 0001 (no backend).

The timer engine (Workout → Timeline flattening, and timestamp-based Session position) is plain TypeScript with no Svelte imports. This keeps it unit-testable and lets a future phone remote or a different UI drive it without a rewrite.

## Consequences

- Do not add `+page.server.ts`, `+server.ts` or form actions. They will not run under `adapter-static`, and they would contradict ADR 0001.
- Any Svelte code is a thin layer over the engine. Timing logic in components is a bug.

## Amendment: SvelteKit's service worker instead of `@vite-pwa/sveltekit`

`@vite-pwa/sveltekit` was the planned route to an installable, offline app, but it supports SvelteKit 1 and 2 only, and the app is on SvelteKit 3. The app uses SvelteKit's built-in service worker instead (`src/service-worker/`), with a hand-written `static/manifest.webmanifest`. `$app/manifest` lists every built and static file to precache, so nothing is lost but Workbox's generated strategies, which an app that only ever serves its own shell does not need.

- The service worker has its own `tsconfig.json` (web worker types) and is excluded from the app's; `npm run check` type-checks both.
- A new version waits until the page sends `skip-waiting`, which it does only when the trainer accepts the reload prompt. The prompt is never shown mid-Session.
