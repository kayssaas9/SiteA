---
name: Vercel deployment diagnostics
description: Constraint when diagnosing Vercel builds from this workspace.
---

Vercel's GitHub status only reports a generic failed deployment and a private deployment URL. Detailed build logs require an authenticated Vercel session or the Vercel integration; public HTTP checks cannot reveal the build error. In this project, a static build can finish while deployment output publication fails when too many API function files are present.

**Why:** The production site can continue serving the previous successful build while a newer Git-triggered deployment fails, so checking the live URL alone does not validate the latest commit. Direct, explicit Vercel rewrites to grouped API handlers also avoid nested catch-all paths being published as generic 404s.

**How to apply:** When a Vercel deployment fails, use the Vercel integration or have the user open the deployment's Logs page and provide the exact failing line before making speculative code changes. If the build succeeds but outputs fail, count API handlers and consolidate related endpoints behind explicit rewrites; verify the live API status responses after publication.