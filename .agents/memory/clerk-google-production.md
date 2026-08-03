---
name: Clerk Google production provider
description: Production Google OAuth must be enabled in the Replit-managed Clerk Auth configuration.
---

Google OAuth can be correctly wired in the frontend and still fail with an “allowed values for parameter strategy” error when the Google provider is not enabled for the Clerk Production instance.

**Why:** Replit-managed Clerk uses separate Development and Production authentication environments, and the published app does not inherit provider settings from the preview environment.

**How to apply:** For published-app Google OAuth failures, verify Auth → Configure → SSO providers → Production first, then republish. Never replace the managed Clerk keys manually.