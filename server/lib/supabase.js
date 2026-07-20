import { createClient } from "@supabase/supabase-js";
import ws from "ws";

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

// Supabase-js appends /rest/v1 itself. If the secret was pasted with the full
// REST endpoint (e.g. .../rest/v1), strip it to avoid "Invalid path specified".
supabaseUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");

// Admin client: bypasses RLS — server-side only, never expose to frontend.
// Pass ws as WebSocket transport for Node.js < 22 compatibility.
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
  realtime: { transport: ws },
});
