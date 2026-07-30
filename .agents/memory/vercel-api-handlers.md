---
name: Vercel API handlers
description: Deployment boundary between the local Express server and the static Vercel build
---

The project runs Express locally, but its Vercel configuration publishes `client/dist` as a static Vite site. Vercel therefore does not execute `server/index.js`; production API endpoints must have Vercel function handlers under `/api`.

**Why:** Express routes can exist and work locally while returning Vercel's `404 NOT_FOUND` in production if no `/api` handler is present.

**How to apply:** For each production API endpoint, add a focused `/api/...` handler, preserve raw request bodies where signature verification requires them, and test the deployed URL directly after publishing.