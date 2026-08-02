---
name: Generation entitlements
description: Credit and teaser rules for Astra image generation.
---

A user with at least 100 credits receives a full, unlocked generation regardless of subscription status. A free user with zero credits may claim exactly one blurred teaser; later attempts open the pricing flow. Accounts with fewer than 100 credits cannot start a paid generation.

**Why:** Credits are the direct entitlement for a full image, while the teaser is only an acquisition path for accounts without credits.

**How to apply:** Keep the entitlement decision server-side before creating the OneShot job, and use distinct API codes for an exhausted free teaser versus an insufficient paid balance.