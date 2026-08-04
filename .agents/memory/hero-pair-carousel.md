---
name: Hero background marquee
description: Reliable behavior for continuously scrolling the landing hero background as an image queue.
---

When the landing hero must show two background panels at a time while four images scroll continuously from right to left, use a single horizontal track containing the image sequence twice and drive its transform directly frame by frame.

**Why:** Replacing image pairs does not create the requested queue-like motion, and the CSS animation did not visibly advance in the deployed page; direct frame updates make the movement observable while duplicating the sequence makes the reset seamless.

**How to apply:** Size each image at half the viewport, make the duplicated track exactly twice the first sequence, update its transform from `requestAnimationFrame` by one full sequence width, and verify the deployed bundle contains the image queue and frame loop.