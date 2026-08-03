---
name: Hero background marquee
description: Reliable behavior for continuously scrolling the landing hero background as an image queue.
---

When the landing hero must show two background panels at a time while four images scroll continuously from right to left, use a single horizontal track containing the image sequence twice.

**Why:** Replacing image pairs does not create the requested queue-like motion; duplicating the sequence makes the reset seamless after the first sequence has fully left the viewport.

**How to apply:** Size each image at half the viewport, make the duplicated track exactly twice the first sequence, animate the track by one full sequence width with linear timing, and verify reduced-motion behavior.