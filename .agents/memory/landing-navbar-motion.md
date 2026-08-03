---
name: Landing navbar motion
description: Durable UX decision for the landing page navbar resize and transparency.
---

The landing navbar should follow scroll progress continuously: resize and reposition it from the top state toward the compact state as the user scrolls, rather than switching between two CSS layouts at a threshold.

**Why:** Repeated threshold-based versions produced a visible “pop” even when CSS transitions were added, because width, height, padding, and layout constraints changed together.

**How to apply:** Keep the scroll listener requestAnimationFrame-throttled and expose a normalized progress value through a CSS custom property. Use that value for the navbar’s dimensions and internal spacing, and keep the landing background translucent so the hero remains visible.