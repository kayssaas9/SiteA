---
name: Dev workflow pnpm commands
description: Reliable command form for keeping the Express and Vite processes alive in the development workflow
---

The development workflow must invoke workspace scripts with `pnpm run <script>` when starting the parallel server and client processes. In this project, the shorthand form `pnpm <script>` can exit cleanly immediately under `concurrently`, leaving Vite running while Express disappears.

**Why:** The workflow appeared healthy because port 5000 was still open, but the backend exited with code 0 and all `/api` requests failed.

**How to apply:** Keep the root `dev` script explicit (`concurrently "pnpm run server" "pnpm run client"`), then verify both the frontend port and `/api/health` after workflow restarts.