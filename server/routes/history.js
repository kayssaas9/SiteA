import express from "express";
import { supabaseAdmin } from "../lib/supabase.js";
import { getGenerationStatus } from "../lib/generation.js";

const router = express.Router();

/**
 * GET /api/history/:clerkUserId
 * Returns the user's generation history, newest first.
 */
router.get("/:clerkUserId", async (req, res) => {
  const { clerkUserId } = req.params;
  const query = typeof req.query.q === "string" ? req.query.q.trim() : "";

  let { data, error } = await supabaseAdmin
    .from("generations")
    .select("id, mode, prompt, image_url, preview_url, unlocked, status, error_message, created_at")
    .eq("clerk_user_id", clerkUserId)
    .ilike(query ? "prompt" : "prompt", query ? `%${query}%` : "%")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("history fetch error:", error);
    return res.status(500).json({ error: error.message });
  }

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
      .select("id, mode, prompt, image_url, preview_url, unlocked, status, error_message, created_at")
      .eq("clerk_user_id", clerkUserId)
      .ilike(query ? "prompt" : "prompt", query ? `%${query}%` : "%")
      .order("created_at", { ascending: false });
    data = refreshed.data ?? data;
  }

  res.json((data ?? []).map(toClientGeneration));
});

/**
 * GET /api/history/:clerkUserId/search?q=...
 * Searches the user's generation history by prompt text (case-insensitive).
 */
router.get("/:clerkUserId/search", async (req, res) => {
  const { clerkUserId } = req.params;
  const { q } = req.query;

  if (!q || q.trim() === "") {
    return res.redirect(`/api/history/${clerkUserId}`);
  }

  let { data, error } = await supabaseAdmin
    .from("generations")
    .select("id, mode, prompt, image_url, preview_url, unlocked, status, error_message, created_at")
    .eq("clerk_user_id", clerkUserId)
    .ilike("prompt", `%${q}%`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("history search error:", error);
    return res.status(500).json({ error: error.message });
  }

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
      .select("id, mode, prompt, image_url, preview_url, unlocked, status, error_message, created_at")
      .eq("clerk_user_id", clerkUserId)
      .ilike("prompt", `%${q}%`)
      .order("created_at", { ascending: false });
    data = refreshed.data ?? data;
  }

  res.json((data ?? []).map(toClientGeneration));
});

function toClientGeneration(item) {
  const status = item.status || "completed";
  const completed = status === "completed";
  const unlocked = completed && item.unlocked !== false;
  return {
    id: item.id,
    mode: item.mode,
    prompt: item.prompt,
    image_url: completed ? (unlocked ? item.image_url : item.preview_url) : null,
    unlocked,
    status,
    error: item.error_message || null,
    created_at: item.created_at,
  };
}

export default router;
