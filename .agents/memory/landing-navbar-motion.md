---
name: Landing navbar motion
description: Durable UX decision for the landing page navbar resize and transparency.
---

The landing navbar should use two fixed sizes: a large top state and a compact state after the scroll threshold. The transition between those states must be smooth, and the landing navbar itself must not use backdrop blur.

**Why:** Continuous scroll resizing was not the requested interaction, while abrupt threshold changes felt like a pop. Backdrop blur also made the navbar visually heavier than desired.

**How to apply:** Keep a simple landing scroll threshold, preserve the navbar's layout box, and animate its compact state primarily with a smooth transform so the threshold does not trigger a reflow pop. Use a translucent solid background with `backdrop-filter: none` on the landing navbar.