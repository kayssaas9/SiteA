---
name: Clerk authentication on Vercel
description: Production admin APIs run as focused Vercel handlers and must verify Clerk session tokens without relying on the local Express middleware.
---

Production uses the static Vite deployment boundary, so Clerk authentication for Vercel API handlers must be implemented inside the handler's server-side auth helper. Verify the Clerk session JWT from the request cookie, with an Authorization Bearer token as a compatible fallback, then resolve the user through the Clerk backend client before applying the admin email allowlist.

**Why:** The local Express middleware and a custom Clerk proxy can work in development while the published Vercel function either does not execute them or returns an HTML 500 before the API handler responds.

**How to apply:** Keep `/api` handlers self-contained, return JSON 403 for unauthenticated or unauthorized requests, and test the deployed endpoint directly after publishing. Do not expose or log token values.