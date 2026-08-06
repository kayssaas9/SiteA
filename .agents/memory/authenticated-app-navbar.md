---
name: Authenticated app navbar
description: Visual boundary between the signed-in application navigation and the public landing navigation.
---

The signed-in application uses a compact, full-width, edge-to-edge top navigation bar with no rounded container. It uses a semi-transparent anthracite glass background with backdrop blur. Its right side includes an Upgrade link to pricing and a custom flag-based language selector with an active checkmark; flags are CSS-rendered rather than emoji-dependent. The public landing keeps its separate floating, rounded navbar treatment.

**Why:** The signed-in experience should feel like an application workspace, matching the reference navigation, while the landing benefits from a more editorial/floating presentation.

**How to apply:** Scope changes for the application chrome to `.header-app`; preserve the translucent blurred background, and keep Upgrade and language controls available on desktop and in the mobile menu. Use a custom dropdown rather than a native select, and CSS flag blocks rather than emoji, so flags and the active checkmark render consistently. Do not replace the landing-specific `.header-landing` styling unless the user explicitly requests a landing redesign.