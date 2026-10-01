# SvelteKit as a static SPA, with a framework-free timer engine

The app is built with SvelteKit (Svelte 5) using `adapter-static` in SPA mode. There is no server-side rendering and no server routes; it deploys as plain static files and is installable as a PWA via `@vite-pwa/sveltekit`. React + Vite was the default alternative and was seriously considered. Svelte was chosen for its lighter runtime and its strength with the single-screen, animation-heavy Session display. SvelteKit's server features are deliberately unused, to stay consistent with ADR 0001 (no backend).

The timer engine (Workout → Timeline flattening, and timestamp-based Session position) is plain TypeScript with no Svelte imports. This keeps it unit-testable and lets a future phone remote or a different UI drive it without a rewrite.

## Consequences

- Do not add `+page.server.ts`, `+server.ts` or form actions. They will not run under `adapter-static`, and they would contradict ADR 0001.
- Any Svelte code is a thin layer over the engine. Timing logic in components is a bug.
