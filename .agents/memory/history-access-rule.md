---
name: History access rule
description: Product rule for deciding when a user can open the generation history.
---

A non-subscriber with at least one recorded generation may access Historique, even without an active subscription. A non-subscriber who has credits but no generation is sent to Tarifs. Subscribers retain access according to their plan and credit state.

**Why:** Users need to retrieve generations they have already created, while the History page remains an upgrade prompt for accounts that have not generated anything.

**How to apply:** Keep the server-provided generation-existence flag as the source for navigation and route guards; do not infer history access from credits alone.