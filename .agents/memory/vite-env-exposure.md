---
name: Vite environment variable exposure
description: How Vite exposes VITE_* prefixed env vars to the client without manual remapping in vite.config.js.
---

Vite exposes any environment variable prefixed with `VITE_` to the client automatically via `import.meta.env`. This means you do **not** need to add them to `vite.config.js` under `define` unless you want to remap a secret from a different name (e.g., `NEXT_PUBLIC_*` → `VITE_*`).

**Why:** In this project, Replit Secrets were named `VITE_STRIPE_PRICE_*`. The frontend was failing to read them because `vite.config.js` was trying to remap from `process.env.STRIPE_PRICE_*` (without `VITE_`) instead of letting Vite expose them directly. The server can also read `VITE_STRIPE_PRICE_*` directly via `process.env`.

**How to apply:**
- If the secret is already named `VITE_*`, do not remap it in `vite.config.js`.
- Only use `define` for variables that do not follow the `VITE_` convention (e.g., `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` → `VITE_CLERK_PUBLISHABLE_KEY`).
- On the server, prefer reading the exact env var name that Replit Secrets provides to avoid mismatches.
