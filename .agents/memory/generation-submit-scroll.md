---
name: Generation submit scroll
description: The generation form must return to the top when submitting from a scrolled position.
---

Submitting a prompt should return the `/generate` page to the top immediately, including while the UI changes into its loading state.

**Why:** Resetting only `window.scrollTo` before the state update can be overridden by the browser or the generator re-render, leaving the user at the bottom of the form.

**How to apply:** Reset `document.scrollingElement` before setting loading state and schedule a second reset after the state change. Keep this behavior for both the button click and Enter submission because both use the same handler.