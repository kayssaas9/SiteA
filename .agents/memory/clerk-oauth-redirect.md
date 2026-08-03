---
name: Clerk OAuth redirect
description: The required redirect behavior for custom Clerk Google sign-in and sign-up flows.
---

For custom `authenticateWithRedirect` flows, keep the callback route technical and force the final destination with `signInForceRedirectUrl` and `signUpForceRedirectUrl` when the destination must be invariant.

**Why:** `redirectUrlComplete` and fallback redirect props can be overridden by an existing Clerk redirect URL or preserved OAuth state, especially during Google sign-up.

**How to apply:** Use the callback's force redirect props for the app's post-auth route, and keep matching `redirectUrlComplete` values in both the sign-in and sign-up initiators.