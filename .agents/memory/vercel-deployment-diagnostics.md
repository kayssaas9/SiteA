---
name: Vercel deployment diagnostics
description: Constraint when diagnosing Vercel builds from this workspace.
---

Vercel's GitHub status only reports a generic failed deployment and a private deployment URL. Detailed build logs require an authenticated Vercel session or the Vercel integration; public HTTP checks cannot reveal the build error.

**Why:** The production site can continue serving the previous successful build while a newer Git-triggered deployment fails, so checking the live URL alone does not validate the latest commit.

**How to apply:** When a Vercel deployment fails, use the Vercel integration or have the user open the deployment's Logs page and provide the exact failing line before making speculative code changes.