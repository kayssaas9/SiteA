---
name: Free teaser quota
description: Accounts with zero credits may generate exactly one real blurred teaser before recharging is required.
---

A Clerk account with zero credits can claim one real teaser generation. The claim is account-scoped, atomically reserved in Supabase, and released if generation or preview persistence fails. Later zero-credit attempts return a recharge/subscription message.

**Why:** This keeps the first-use experience accessible while limiting abuse without relying on unreliable IP-based limits.

**How to apply:** Keep the quota server-side and atomic; the client must never block a zero-credit account before calling the generation API.