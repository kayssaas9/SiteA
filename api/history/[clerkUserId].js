import { supabaseAdmin } from "../../server/lib/supabase.js";

function toClientGeneration(item) {
  const unlocked = item.unlocked !== false;
  return {
    id: item.id,
    mode: item.mode,
    prompt: item.prompt,
    image_url: unlocked ? item.image_url : item.preview_url,
    unlocked,
    created_at: item.created_at,
  };
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { clerkUserId } = req.query;
  const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
  let request = supabaseAdmin
    .from("generations")
    .select("id, mode, prompt, image_url, preview_url, unlocked, created_at")
    .eq("clerk_user_id", clerkUserId)
    .order("created_at", { ascending: false });

  if (query) request = request.ilike("prompt", `%${query}%`);
  const { data, error } = await request;
  if (error) return res.status(500).json({ error: error.message });
  return res.json((data ?? []).map(toClientGeneration));
}