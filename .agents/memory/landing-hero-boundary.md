---
name: Landing hero boundary
description: The visible transition below the landing CTA is controlled by the hero height and its bottom fade.
---

The landing transition line is the bottom boundary of the hero, not the separate page-level gradient between the hero and reviews.

**Why:** Moving only an overlay gradient does not move the visible cutoff beneath the CTA; the hero itself must be extended when that boundary needs to move lower.

**How to apply:** Adjust the landing hero height and keep the transition layer aligned to that same boundary, while preserving the CTA and counter positions.