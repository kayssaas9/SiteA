import express from "express";
import { supabaseAdmin } from "../lib/supabase.js";

const router = express.Router();

/** GET /api/user/:clerkUserId — fetch plan + credits for display in UI */
router.get("/:clerkUserId", async (req, res) => {
  const { clerkUserId } = req.params;

  const { data, error } = await supabaseAdmin
    .from("users")
    .select("plan, credits, email")
    .eq("clerk_user_id", clerkUserId)
    .single();

  if (error) return res.status(404).json({ error: "User not found" });
  res.json(data);
});

/**
 * POST /api/user/ensure
 * Body: { clerkUserId, email }
 * Upserts a user row. Used as a fallback when the Clerk webhook fails or is
 * not configured yet, so the UI can still operate immediately after sign-up.
 */
router.post("/ensure", express.json(), async (req, res) => {
  const { clerkUserId, email } = req.body;

  if (!clerkUserId || !email) {
    return res.status(400).json({ error: "clerkUserId and email are required" });
  }

  const { data, error } = await supabaseAdmin
    .from("users")
    .upsert(
      { clerk_user_id: clerkUserId, email, plan: "free", credits: 0 },
      { onConflict: "clerk_user_id" }
    )
    .select("plan, credits, email")
    .single();

  if (error) {
    console.error("ensure user error:", error);
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

export default router;
