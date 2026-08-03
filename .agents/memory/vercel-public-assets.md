---
name: Vercel public asset paths
description: Static image assets in this Vite deployment are reliably served from the existing landing-examples public path.
---

For new landing images, use a path under the already-served `landing-examples` public directory rather than introducing a new public subdirectory.

**Why:** Vercel served existing landing example assets but returned 404 for the newly introduced hero subdirectory in this deployment.

**How to apply:** Put new landing visuals in the established public asset directory, reference them with root-relative URLs, and verify the deployed URL returns 200 before considering the work complete.