---
name: Mobile result proxy
description: Serve generated images through Astra instead of exposing upstream OneShot URLs to mobile browsers.
---

Generated and history image URLs should use the authenticated Astra image route, which fetches the stored source server-side and streams it to the browser. Local upload previews should use FileReader instead of object URLs for Safari compatibility.

**Why:** Mobile Safari can reject upstream or malformed image URLs with “The string did not match the pattern,” even when desktop browsers display them successfully.

**How to apply:** Keep original URLs server-side, authorize the requesting Clerk user at the proxy route, and expose only relative `/api/generations/.../image` URLs to result and history components.