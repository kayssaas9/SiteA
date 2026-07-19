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

export default router;
