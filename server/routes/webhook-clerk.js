import express from "express";
import { Webhook } from "svix";
import { supabaseAdmin } from "../lib/supabase.js";
import { getOrCreateUserCode } from "./referral.js";

const router = express.Router();

/**
 * POST /api/webhook/clerk
 * Clerk sends user.created / user.deleted events here.
 * Configure this URL in Clerk Dashboard → Webhooks.
 * Signing secret must be set as CLERK_WEBHOOK_SECRET in Replit Secrets.
 */
router.post("/", express.raw({ type: "application/json" }), async (req, res) => {
  const secret = process.env.CLERK_WEBHOOK_SECRET;

  if (!secret) {
    console.error("CLERK_WEBHOOK_SECRET not set — skipping signature verification");
    return res.status(500).json({ error: "Webhook secret not configured" });
  }

  // Verify Svix signature
  const svix = new Webhook(secret);
  let event;
  try {
    event = svix.verify(req.body, {
      "svix-id":        req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"],
    });
  } catch (err) {
    console.error("Clerk webhook signature invalid:", err.message);
    return res.status(400).json({ error: "Invalid signature" });
  }

  const { type, data } = event;

  if (type === "user.created") {
    const clerkUserId = data.id;
    const email =
      data.email_addresses?.[0]?.email_address ?? "";

    const { error } = await supabaseAdmin
      .from("users")
      .upsert(
        { clerk_user_id: clerkUserId, email, plan: "free", credits: 0 },
        { onConflict: "clerk_user_id" }
      );

    if (error) {
      console.error("Supabase upsert error:", error);
      return res.status(500).json({ error: error.message });
    }

    // Generate a unique referral code for the new user (idempotent).
    try {
      await getOrCreateUserCode(clerkUserId);
    } catch (codeErr) {
      console.error("Failed to generate referral code:", codeErr);
    }

    console.log(`✅ User created in Supabase: ${clerkUserId} (${email})`);
  }

  if (type === "user.deleted") {
    const { error } = await supabaseAdmin
      .from("users")
      .delete()
      .eq("clerk_user_id", data.id);

    if (error) console.error("Supabase delete error:", error);
    else console.log(`🗑  User deleted from Supabase: ${data.id}`);
  }

  res.json({ received: true });
});

export default router;
