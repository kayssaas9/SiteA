---
name: Credit balance semantics
description: The distinction between subscription credits and purchased credit packs.
---

Expert's server-side credit balance is capped at 20,000 credits. The credit pack UI remains unchanged and continues to show the available packs to Expert users.

**Why:** The user explicitly requested a 20,000-credit limit for Expert users while keeping the existing pack presentation unchanged.

**How to apply:** Keep all packs visible in the UI. Enforce the cap in credit-granting code and the atomic Supabase increment function for Expert only; Basic, Pro, and free balances remain additive.