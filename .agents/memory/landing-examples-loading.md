---
name: Landing examples loading
description: The landing before/after examples need lightweight assets and synchronized image readiness before switching.
---

Use optimized WebP assets for every landing example pair, preload all pairs from the document head, and wait for both images to decode before changing the visible example.

**Why:** The original examples mixed multi-megabyte PNG/JPEG assets with smaller files, so each click could show one image before the other, especially on mobile. Preloading alone was not enough when the browser had not finished decoding.

**How to apply:** Keep the current example-switch guard and readiness cache when changing example assets; if a source image changes, regenerate its optimized WebP and update the preload link and example data together.