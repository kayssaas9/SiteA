---
name: Clerk OAuth redirect
description: The required redirect behavior for custom Clerk Google sign-in and sign-up flows.
---

For custom `authenticateWithRedirect` flows, keep the callback route technical and force the final destination with `signInForceRedirectUrl` and `signUpForceRedirectUrl` when the destination must be invariant. If Clerk still applies a stale redirect, preserve the standard callback and handle the post-sign-up destination at the app route level without replacing the active session.

**Why:** `redirectUrlComplete` and fallback redirect props can be overridden by an existing Clerk redirect URL or preserved OAuth state, especially during Google sign-up. A custom callback/navigation replacement can interrupt session finalization. Rendering the landing page before the app-level redirect creates a visible flash.

**How to apply:** Use the callback's force redirect props for the app's post-auth route, keep matching `redirectUrlComplete` values in both initiators, and gate the home route while a sign-up marker is pending so the app redirects after Clerk is loaded without first rendering the landing page.