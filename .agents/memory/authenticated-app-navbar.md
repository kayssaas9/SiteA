---
name: Authenticated app navbar
description: Visual boundary between the signed-in application navigation and the public landing navigation.
---

The signed-in application uses a full-width, edge-to-edge top navigation bar with no rounded container. The public landing keeps its separate floating, rounded navbar treatment.

**Why:** The signed-in experience should feel like an application workspace, matching the reference navigation, while the landing benefits from a more editorial/floating presentation.

**How to apply:** Scope changes for the application chrome to `.header-app`; do not replace the landing-specific `.header-landing` styling unless the user explicitly requests a landing redesign.