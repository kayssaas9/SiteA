import express from "express";
import { supabaseAdmin } from "../lib/supabase.js";

const router = express.Router();

router.get("/:generationId", async (req, res) => {
  const { generationId } = req.params;
  const { clerkUserId } = req.query;

  if (!clerkUserId) {
    return res.status(400).json({ error: "clerkUserId is required" });
  }

  const { data, error } = await supabaseAdmin
    .from("generations")
    .select("id, image_url, preview_url, unlocked")
    .eq("id", generationId)
    .eq("clerk_user_id", clerkUserId)
    .single();

  if (error || !data) {
    return res.status(error?.code === "PGRST116" ? 404 : 500).json({
      error: error?.message || "Generation not found",
    });
  }

  const unlocked = data.unlocked !== false;
  return res.json({
    id: data.id,
    unlocked,
    teaser: !unlocked,
    imageUrl: unlocked ? data.image_url : data.preview_url,
  });
});

export default router;