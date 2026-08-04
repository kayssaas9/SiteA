---
name: Hero background marquee
description: Reliable behavior for continuously scrolling the landing hero background as an image queue.
---

When a landing marquee must show cards or background panels while content scrolls continuously in either direction, use a single horizontal track containing the sequence twice and drive its transform directly frame by frame.

**Why:** Replacing pairs does not create queue-like motion, and CSS animation did not visibly advance in the deployed page; direct frame updates make movement observable while duplicating the sequence makes the reset seamless.

**How to apply:** Size each item consistently, make the duplicated track exactly twice the first sequence, update its transform from `requestAnimationFrame` by one full sequence width, and choose a negative-to-zero offset for rightward motion or zero-to-negative for leftward motion.