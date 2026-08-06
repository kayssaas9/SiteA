---
name: Landing navbar motion
description: Durable UX decision for the landing page navbar resize and transparency.
---

The landing navbar should use two fixed container states: a roomy top state and a tighter state after the scroll threshold. The transition between those states must be smooth, while the logo, text, links, and buttons keep the same size. The landing navbar itself must not use backdrop blur.

**Why:** Continuous scroll resizing was not the requested interaction, abrupt threshold changes felt like a pop, and shrinking the contents made the navbar feel wrong. Backdrop blur also made the navbar visually heavier than desired.

**How to apply:** Keep a simple landing scroll threshold and animate only the container's width, height, padding, radius, and surface treatment. Do not use transform scaling or scroll-state font/logo/button size overrides. Use a translucent solid background with `backdrop-filter: none` on the landing navbar.