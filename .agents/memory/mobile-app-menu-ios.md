---
name: iOS app mobile menu
description: Constraints for keeping the authenticated full-screen mobile menu reliable on iPhone Safari.
---

The authenticated mobile menu must render through a portal, avoid translated fixed overlays, lock the document scroll while open, and account for dynamic viewport and safe-area insets.

**Why:** iOS Safari can clip or composite fixed descendants unexpectedly when an ancestor uses blur, transform, or another containing-block effect; Crisp can also remain above normal application layers.

**How to apply:** Keep the overlay directly under `document.body`, use `100dvh` with `100svh` fallback, hide Crisp while open, and restore the exact scroll position when closing.