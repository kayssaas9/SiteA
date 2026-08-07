---
name: Generation reset and resume
description: Starting a new generation from the result view must suppress automatic recovery of the previous job once.
---

The “new generation” action must clear persisted generation IDs and explicitly skip the generator bootstrap resume pass for the next mount. Active jobs should also carry a temporary URL identifier so a refresh can reattach to the exact server-side job even if in-memory component state is lost.

**Why:** Persistent jobs are intentionally recovered after refresh, but that same recovery conflicts with an explicit user request to start over. Browser refreshes can discard component state before the local polling callback finishes.

**How to apply:** Keep normal resume behavior for refreshes and navigation, preserve the active generation identifier in local storage and the URL while it runs, and pass a one-shot fresh-start flag when leaving the result showcase so active history is not reattached.