import express from "express";
import { supabaseAdmin } from "../lib/supabase.js";

const router = express.Router();

/**
 * GET /api/history/:clerkUserId
 * Returns the user's generation history, newest first.
 */
router.get("/:clerkUserId", async (req, res) => {
  const { clerkUserId } = req.params;
  const query = typeof req.query.q === "string" ? req.query.q.trim() : "";

  const { data, error } = await supabaseAdmin
    .from("generations")
    .select("id, mode, prompt, image_url, preview_url, unlocked, created_at")
    .eq("clerk_user_id", clerkUserId)
    .ilike(query ? "prompt" : "prompt", query ? `%${query}%` : "%")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("history fetch error:", error);
    return res.status(500).json({ error: error.message });
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

  const { data, error } = await supabaseAdmin
    .from("generations")
    .select("id, mode, prompt, image_url, preview_url, unlocked, created_at")
    .eq("clerk_user_id", clerkUserId)
    .ilike("prompt", `%${q}%`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("history search error:", error);
    return res.status(500).json({ error: error.message });
  }

  res.json((data ?? []).map(toClientGeneration));
});

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

export default router;
