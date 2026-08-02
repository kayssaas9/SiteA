---
name: Generation reset and resume
description: Starting a new generation from the result view must suppress automatic recovery of the previous job once.
---

The “new generation” action must clear persisted generation IDs and explicitly skip the generator bootstrap resume pass for the next mount. Otherwise the history scan can immediately restore the previous result.

**Why:** Persistent jobs are intentionally recovered after refresh, but that same recovery conflicts with an explicit user request to start over.

**How to apply:** Keep normal resume behavior for refreshes and navigation, but pass a one-shot fresh-start flag when leaving the result showcase so active history is not reattached.