import express from "express";
import { stripe } from "../lib/stripe.js";
import { supabaseAdmin } from "../lib/supabase.js";

const router = express.Router();

/**
 * POST /api/checkout
 * Body: { priceId, clerkUserId, mode: "subscription" | "payment" }
 * Returns: { url } — redirect the user to this Stripe Checkout URL.
 */
router.post("/", async (req, res) => {
  const { priceId, clerkUserId, mode = "subscription" } = req.body;

  if (!priceId || !clerkUserId) {
    return res.status(400).json({ error: "priceId and clerkUserId are required" });
  }

  try {
    // Look up or create the Stripe customer tied to this Clerk user
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("email, stripe_customer_id")
      .eq("clerk_user_id", clerkUserId)
      .single();

    let customerId = user?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user?.email,
        metadata: { clerk_user_id: clerkUserId },
      });
      customerId = customer.id;

      // Persist the Stripe customer ID
      await supabaseAdmin
        .from("users")
        .update({ stripe_customer_id: customerId })
        .eq("clerk_user_id", clerkUserId);
    }

    const origin =
      process.env.APP_URL ||
      `https://${process.env.REPLIT_DEV_DOMAIN}` ||
      "http://localhost:5000";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode,                          // "subscription" or "payment"
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/?checkout=success`,
      cancel_url:  `${origin}/pricing?checkout=cancelled`,
      metadata: { clerk_user_id: clerkUserId },
      ...(mode === "subscription" && {
        subscription_data: { metadata: { clerk_user_id: clerkUserId } },
      }),
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
