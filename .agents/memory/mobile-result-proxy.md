---
name: Mobile result proxy
description: Serve generated images through Astra instead of exposing upstream OneShot URLs to mobile browsers.
---

Generated and history image URLs should use the authenticated Astra image route, which fetches the stored source server-side and streams it to the browser. Upload previews should be normalized server-side; the browser must not create local object URLs or decode HEIC/HEIF.

**Why:** Mobile Safari can reject camera-produced file previews or upstream/malformed image URLs with “The string did not match the pattern,” even when desktop browsers work.

**How to apply:** Keep original URLs server-side, authorize the requesting Clerk user at the proxy route, expose only relative `/api/generations/.../image` URLs, and let the server normalize all upload bytes for previews and OneShot. Avoid local preview APIs entirely.