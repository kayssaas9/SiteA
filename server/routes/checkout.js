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

/**
 * POST /api/checkout/cancel-subscription
 * Body: { clerkUserId }
 *
 * Schedules the active subscription to cancel at the end of the current
 * billing period. Access is not interrupted immediately.
 */
router.post("/cancel-subscription", async (req, res) => {
  const { clerkUserId } = req.body;

  if (!clerkUserId) {
    return res.status(400).json({ error: "clerkUserId is required" });
  }

  try {
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("stripe_customer_id")
      .eq("clerk_user_id", clerkUserId)
      .single();

    if (userError || !user?.stripe_customer_id) {
      return res.status(404).json({ error: "Aucun abonnement trouvé." });
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripe_customer_id,
      status: "all",
      limit: 10,
    });

    const subscription = subscriptions.data.find((item) =>
      ["active", "trialing", "past_due"].includes(item.status)
    );

    if (!subscription) {
      return res.status(404).json({ error: "Aucun abonnement actif trouvé." });
    }

    if (subscription.cancel_at_period_end) {
      return res.json({
        cancelAtPeriodEnd: true,
        currentPeriodEnd: subscription.current_period_end,
      });
    }

    const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: true,
    });

    res.json({
      cancelAtPeriodEnd: true,
      currentPeriodEnd: updatedSubscription.current_period_end,
    });
  } catch (err) {
    console.error("Stripe cancellation error:", err.message);
    res.status(500).json({ error: "Impossible d'annuler l'abonnement pour le moment." });
  }
});

export default router;
