# hiit-rome

- Captured at: 5e8a5e2 on 2026-10-12 (tree clean apart from untracked `.scratch/studio-redesign/` docs, no UI changes)
- Stack: SvelteKit 3 (Svelte 5 runes) client-only SPA, adapter-static, plain scoped CSS with custom-property tokens; bundled fonts via @fontsource-variable; PWA with a service worker. Platform: web
- Dark mode: no (light only; no prefers-color-scheme and no toggle)
- Responsive: yes (breakpoints: max-width 1500, 1100, 1000, 900, 640 and 560px; max-height 800px; orientation: portrait for the Session, Countdown and Resume screens; the Session, Countdown and Resume prompt scale with `--tv` = one px of a 1920×1080 design). Design target is 1920×1080 on a TV or laptop; the project spec calls a dedicated phone layout out of scope, but narrow widths must not break.
- Primary viewport: desktop (captured at 1280×800; mobile at 390×844)
- Current tokens: src/app.css (`:root` custom properties), src/lib/engine/palette.ts (Kind colors), src/lib/ui/Icon.svelte (icon set); see current-tokens.json
- UI paths: src/routes/**/*.svelte, src/lib/**/*.svelte, src/app.css, src/app.html, src/lib/engine/palette.ts

## Navigation
Only My Workouts (`/`) has the app nav. Every other screen is reached from it and leads back with a "← <parent>" link.

- Sidebar on `/` (stacks on top at ≤900px), in order:
  - Brand "hiit-rome"
  - **New Workout** (button: creates a Workout and opens `/edit/<id>`)
  - Nav "Create":
    - **My Workouts** → `/`
      - card Start → `/session/[id]` (Session, then its summary → "Back to My Workouts")
      - card Edit → `/edit/[id]` ("← My Workouts"; Start → `/session/[id]`)
      - card Share → copies a `/share#…` link
    - **Wizard** → `/wizard` ("← My Workouts")
      - HIIT / Tabata / Circuit / EMOM → `/wizard/[style]` ("← Wizards"; Start now → `/session/[new]`, Save & edit → `/edit/[new]`)
    - **Library** → `/library` ("← My Workouts")
      - Sample card → `/library/[id]` ("← Library"; Start → `/session/[sample]`, Edit your copy → `/edit/[new]`)
    - **Countdown** → `/countdown` ("← My Workouts"; Edit Presets in Settings → `/settings#countdown-heading`)
    - **Settings** → `/settings` ("← My Workouts")
- Outside the nav:
  - `/share#<data>` (opened from a shared link; "← My Workouts")
  - Resume prompt (any route, on a full load with a saved Session)
  - Error page (unknown routes)
- Global overlays: the update banner (bottom right, every screen except Session/Countdown); Undo toasts (bottom center).

## Screens
| Rank | Id | Route | Spec | Screenshots | Gaps |
|---|---|---|---|---|---|
| 1 | home | / | home.md | home.png, home.mobile.png, home@no-match.png, home@undo-toast.png | update banner and load-error states spec-only (need a waiting service worker / a broken IndexedDB) |
| 2 | session | /session/[id] | session.md | session.png, session.mobile.png, session@running.png, session@interval-list.png, session@summary.png | paused, confirm dialogs, can't-start and not-found spec-only (3-state cap) |
| 3 | edit | /edit/[id] | edit.md | edit.png, edit.mobile.png, edit@settings-open.png, edit@selection.png, edit@undo-toast.png | empty Group, drag, blocked and save-failed spec-only (3-state cap) |
| 4 | wizard | /wizard | wizard.md | wizard.png, wizard.mobile.png | — |
| 5 | library | /library | library.md | library.png, library.mobile.png | — |
| 6 | countdown | /countdown | countdown.md | countdown.png, countdown.mobile.png, countdown@running.png, countdown@time-up.png, countdown@end-current.png | paused and confirm dialogs spec-only (3-state cap) |
| 7 | settings | /settings | settings.md | settings.png, settings.mobile.png, settings@exported.png, settings@import-dialog.png | load/save/import error states spec-only |
| 8 | wizard-style | /wizard/[style] | wizard-style.md | wizard-style.png, wizard-style.mobile.png, wizard-style@circuit.png, wizard-style@not-found.png | HIIT and EMOM forms spec-only (same frame as Tabata/Circuit) |
| 9 | library-sample | /library/[id] | library-sample.md | library-sample.png, library-sample.mobile.png, library-sample@added.png, library-sample@not-found.png | — |
| 10 | share | /share#… | share.md | share.png, share.mobile.png, share@invalid-link.png | — |
| 11 | resume | (layout, on load) | resume.md | resume.png, resume.mobile.png | — |
| 12 | error | (unknown route) | error.md | error.png, error.mobile.png | — |
