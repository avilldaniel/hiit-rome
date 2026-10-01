# 13 — Share links

**What to build:** The trainer shares a Workout as a link that carries the whole Workout in the URL fragment, which never reaches a server. Opening the link on another device shows a preview with "Add to my Workouts" and "Start".

Reference: spec "Transfer" (share-link codec), ADR 0001.

**Blocked by:** 05 — My Workouts: storage and home

**Status:** ready-for-agent

- [ ] Codec: Workout → URL whose fragment holds a versioned, compressed (deflate + base64url) serialization of the Workout's content, without its id, favorite flag or timestamps. URL → Workout, with version checks and validation.
- [ ] Tests at seam B: round trip, plus rejection of corrupt and unknown-version links.
- [ ] Share action on Workout cards (and in the editor) copies the link, using the native share sheet where available.
- [ ] Opening a share link shows a preview (outline and total) with "Add to my Workouts" (fresh id) and "Start". Invalid links show a friendly error.
- [ ] A Playwright smoke test: open a generated link, add it, and see it in My Workouts.
