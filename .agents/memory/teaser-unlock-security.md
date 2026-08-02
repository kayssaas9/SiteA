---
name: Teaser unlock security
description: Teaser generations must expose only a server-generated derivative until the specific paid generation is unlocked.
---

The original generation URL must remain server-side while a teaser is locked. Payment metadata should identify the exact generation to unlock, rather than unlocking a user's entire history.

**Why:** A CSS blur is not a security boundary, and broad user-level unlocks can reveal unrelated older generations after a single purchase.

**How to apply:** Keep client/history responses on `preview_url` while `unlocked` is false, return `image_url` only after an ownership-checked lookup confirms unlock, and attach the generation ID to the Stripe checkout session.