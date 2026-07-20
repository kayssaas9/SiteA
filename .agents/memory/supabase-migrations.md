---
name: Supabase migrations in this project
description: This project uses Supabase (not Replit's built-in PostgreSQL), so migrations must run in Supabase SQL Editor.
---

This project persists user data in **Supabase**, not in Replit's built-in PostgreSQL database. As a result, schema migrations in `supabase/migrations/*.sql` must be executed manually in the Supabase SQL Editor.

**Why:** Replit's `executeSql` database skill targets the built-in Replit database, which does not contain the `users` table. Running migrations there fails with `relation "public.users" does not exist`.

**How to apply:**
- When a new migration is added, instruct the user to copy/paste the SQL into Supabase Dashboard → SQL Editor → New query → Run.
- The `SUPABASE_SERVICE_ROLE_KEY` and `NEXT_PUBLIC_SUPABASE_URL` secrets are already configured for the Supabase client (`@supabase/supabase-js`).
- After running a migration in Supabase, the backend code can immediately use the new column/table without restart (the client reads the live schema).
