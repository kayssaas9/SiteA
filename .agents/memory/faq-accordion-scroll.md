---
name: FAQ accordion scroll
description: The landing FAQ must expand in place without moving the clicked question.
---

The FAQ response must open directly below its question while the question stays at the same viewport position.

**Why:** The browser can reposition a focused button when expanding content, which makes the question appear to jump upward instead of behaving like the provided reference.

**How to apply:** Prevent pointer/mouse focus during FAQ activation, preserve the scroll position before state changes, and restore it during layout effects. Keep the answer as a normal block immediately after the question.