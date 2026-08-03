---
name: Astra subscription promo code
description: The DECOUVERTE campaign applies a 20% discount to subscriptions only.
---

The `DECOUVERTE` promotion is restricted to subscription checkout sessions reached from the no-credit pricing modal. It is displayed only in that modal; the regular pricing page shows standard prices and no promotion. Credit packs and SnapRouge payments must keep their regular prices.

**Why:** The campaign is intended as a contextual offer for users who have exhausted their credits, without changing the public pricing presentation or reducing the price of one-time purchases and SnapRouge.

**How to apply:** Keep the code validated server-side before passing the Stripe promotion code to Checkout. Only the no-credit modal flow should request it; keep standard prices on the regular pricing page.