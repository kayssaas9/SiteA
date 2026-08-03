---
name: Clerk OAuth redirect
description: The required redirect behavior for custom Clerk Google sign-in and sign-up flows.
---

For custom `authenticateWithRedirect` flows, keep the callback route technical and force the final destination with `signInForceRedirectUrl` and `signUpForceRedirectUrl` when the destination must be invariant. If Clerk still applies a stale redirect, use a custom callback that calls `clerk.handleRedirectCallback` with a custom navigation function.

**Why:** `redirectUrlComplete` and fallback redirect props can be overridden by an existing Clerk redirect URL or preserved OAuth state, especially during Google sign-up. The stock callback component only forwards parameters and does not provide an app-level post-callback guarantee.

**How to apply:** Use the callback's force redirect props for the app's post-auth route, keep matching `redirectUrlComplete` values in both initiators, and use the callback's custom navigation hook when the final route must be guaranteed.