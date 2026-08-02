---
name: Generation counting
description: Count finalized generations from the database completion transition.
---

Generation totals are initialized from completed rows and incremented by a database trigger only when a generation first transitions to `completed`; teaser completions count, failures do not.

**Why:** Persisted OneShot jobs can be retried or resumed, so application-level increments can double-count without a database-side transition guard.

**How to apply:** Keep the trigger idempotent on `status`, and do not increment on inserts, processing/finalizing states, or failed generations.