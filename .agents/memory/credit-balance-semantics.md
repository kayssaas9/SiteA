---
name: Credit balance semantics
description: The distinction between subscription credits and purchased credit packs.
---

Expert's subscription entitlement is 20,000 credits per subscription grant or renewal. This is not a maximum wallet balance. One-time purchased packs are additive and can raise the balance above 20,000.

**Why:** The user clarified that a customer must be able to combine Expert subscription credits with multiple purchased packs.

**How to apply:** Never cap the `users.credits` balance based on the user's plan. Apply the Expert amount only when granting the subscription entitlement; add pack and reward credits normally.