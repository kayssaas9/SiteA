---
name: Mobile result proxy
description: Serve generated images through Astra instead of exposing upstream OneShot URLs to mobile browsers.
---

Generated and history image URLs should use the authenticated Astra image route, which fetches the stored source server-side and streams it to the browser. Uploads should send original file bytes to the server without browser-side image decoding or local preview URLs.

**Why:** Mobile Safari can reject camera-produced file previews or upstream/malformed image URLs with “The string did not match the pattern,” even when desktop browsers work.

**How to apply:** Keep original URLs server-side, authorize the requesting Clerk user at the proxy route, expose only relative `/api/generations/.../image` URLs, and let the server normalize HEIC/HEIF bytes.