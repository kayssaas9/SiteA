---
name: OneShot result URL handling
description: OneShot may return generated image URLs in several result shapes, and invalid values must be rejected before fetch or browser URL APIs.
---

Normalize every OneShot image result through URL validation before storing or fetching it. Accept the documented URL fields and array/object variants, but only keep absolute HTTP(S) URLs.

**Why:** Passing an empty, relative, or object value into URL/fetch APIs can surface the opaque “The string did not match the pattern” error and break finalization.

**How to apply:** Keep URL extraction server-side, fail the generation with a readable message when no valid URL exists, and never expose an unvalidated result URL to the client.