import { supabaseAdmin } from "../../server/lib/supabase.js";
import { getGenerationStatus } from "../../server/lib/generation.js";

function toClientGeneration(item) {
  const status = item.status || "completed";
  const completed = status === "completed";
  const unlocked = completed && item.unlocked !== false;
  return {
    id: item.id,
    mode: item.mode,
    prompt: item.prompt,
    image_url: completed
      ? `/api/generations/${encodeURIComponent(item.id)}/image?clerkUserId=${encodeURIComponent(item.clerk_user_id)}`
      : null,
    unlocked,
    status,
    error: item.error_message || null,
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
    .select("id, clerk_user_id, mode, prompt, image_url, preview_url, unlocked, status, error_message, created_at")
    .eq("clerk_user_id", clerkUserId)
    .order("created_at", { ascending: false });

  if (query) request = request.ilike("prompt", `%${query}%`);
  let { data, error } = await request;
  if (error) return res.status(500).json({ error: error.message });

  const active = (data ?? []).filter(
    (item) => item.status === "processing" || item.status === "finalizing",
  );
  if (active.length) {
    await Promise.all(
      active.map((item) =>
        getGenerationStatus(item.id, clerkUserId).catch((statusError) => {
          console.error(`generation resume error ${item.id}:`, statusError.message);
          return null;
        }),
      ),
    );

    const refreshed = await supabaseAdmin
      .from("generations")
      .select("id, clerk_user_id, mode, prompt, image_url, preview_url, unlocked, status, error_message, created_at")
      .eq("clerk_user_id", clerkUserId)
      .order("created_at", { ascending: false });
    data = refreshed.data ?? data;
    if (query) data = data.filter((item) => item.prompt?.toLowerCase().includes(query.toLowerCase()));
  }

  return res.json((data ?? []).map(toClientGeneration));
}