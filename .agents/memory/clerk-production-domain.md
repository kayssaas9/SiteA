---
name: Clerk production domain
description: Domain restriction affecting Clerk authentication during development previews and production checks
---

Clerk production publishable keys are restricted to the configured production domain and reject the Replit preview origin (`*.replit.dev`) with an origin/API error.

**Why:** The app can render its public UI locally while Clerk authentication logs errors in the preview, which can be mistaken for a broken production build.

**How to apply:** Use a development Clerk key for Replit preview testing, or validate production auth only on `app.astracrea.com`; never expose or copy key values into code.