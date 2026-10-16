---
id: error
name: Error page
route: any unknown address (e.g. /no-such-page)
source: src/routes/+error.svelte, src/lib/ui/MessagePage.svelte, src/lib/ui/Message.svelte
viewports: [desktop, mobile]
---

# Error page

What SvelteKit shows for an address the app doesn't have, or an unexpected error, drawn as the app's message card.

## Regions
- A single white message card, top-left of the page on the gray ground. The same MessagePage frame is used by "Workout not found", "Wizard not found" and "<name> can’t start yet".

## Navigation
- none (no back link on this page; the MessagePage variants elsewhere carry their own links)

## Actions
- none

## Fields
- none

## Data displays
- The status code as the heading ("404") and the error message ("Not Found").

## Sections
- none

## States
- **404** (captured: error.png, error.mobile.png).

## Copy
- "<status>" (h1), "<error message>" (e.g. "404", "Not Found")
