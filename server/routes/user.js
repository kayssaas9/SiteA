import express from "express";
import { supabaseAdmin } from "../lib/supabase.js";
import { getOrCreateUserCode } from "./referral.js";

const router = express.Router();

/** GET /api/user/:clerkUserId — fetch plan + credits for display in UI */
router.get("/:clerkUserId", async (req, res) => {
  const { clerkUserId } = req.params;

  const { data, error } = await supabaseAdmin
    .from("users")
    .select("plan, credits, email, snaprouge_unlocked, survey_completed")
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

  // Only create the user if it does not exist; never overwrite existing credits,
  // survey completion status, or other progress.
  let userRow = await supabaseAdmin
    .from("users")
    .select("plan, credits, email, snaprouge_unlocked, survey_completed")
    .eq("clerk_user_id", clerkUserId)
    .single();

  if (userRow.error && userRow.error.code !== "PGRST116") {
    console.error("ensure user error:", userRow.error);
    return res.status(500).json({ error: userRow.error.message });
  }

  if (!userRow.data) {
    const insertRes = await supabaseAdmin
      .from("users")
      .insert({
        clerk_user_id: clerkUserId,
        email,
        plan: "free",
        credits: 0,
        snaprouge_unlocked: false,
        survey_completed: false,
      })
      .select("plan, credits, email, snaprouge_unlocked, survey_completed")
      .single();

    if (insertRes.error) {
      console.error("ensure user insert error:", insertRes.error);
      return res.status(500).json({ error: insertRes.error.message });
    }
    userRow = insertRes;
  }

  // Ensure the user has a referral code (idempotent).
  try {
    await getOrCreateUserCode(clerkUserId);
  } catch (codeErr) {
    console.error("ensure referral code error:", codeErr);
  }

  res.json(userRow.data);
});

export default router;
