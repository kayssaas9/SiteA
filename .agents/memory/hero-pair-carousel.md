---
name: Hero pair carousel
description: Reliable behavior for rotating the landing hero background in visible pairs.
---

When the landing hero must show two background panels at a time and visibly rotate through four images, use explicit state-driven paired slides with a timed transform transition instead of relying on a long CSS track animation.

**Why:** The earlier CSS track approach appeared static in the preview and made it difficult to verify that the second pair was ever shown.

**How to apply:** Keep each visible pair in its own slide, update the active slide on a clear interval, and verify the deployed JavaScript bundle contains both pairs and the interval.