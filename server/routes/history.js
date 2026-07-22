import express from "express";
import { supabaseAdmin } from "../lib/supabase.js";

const router = express.Router();

/**
 * GET /api/history/:clerkUserId
 * Returns the user's generation history, newest first.
 */
router.get("/:clerkUserId", async (req, res) => {
  const { clerkUserId } = req.params;

  const { data, error } = await supabaseAdmin
    .from("generations")
    .select("id, mode, prompt, image_url, created_at")
    .eq("clerk_user_id", clerkUserId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("history fetch error:", error);
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
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
    .select("id, mode, prompt, image_url, created_at")
    .eq("clerk_user_id", clerkUserId)
    .ilike("prompt", `%${q}%`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("history search error:", error);
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

export default router;
