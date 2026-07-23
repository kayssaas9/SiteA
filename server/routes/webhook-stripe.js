import express from "express";
import { stripe, PRICE_CREDITS, PRICE_PLANS, SNAP_ROUGE_PRICE } from "../lib/stripe.js";
import { supabaseAdmin } from "../lib/supabase.js";

const router = express.Router();

/**
 * POST /api/webhook/stripe
 * Raw body (set in index.js before express.json middleware).
 * Configure in Stripe Dashboard → Webhooks → your endpoint.
 * Add STRIPE_WEBHOOK_SECRET to Replit Secrets.
 */
router.post("/", express.raw({ type: "application/json" }), async (req, res) => {
  const sig     = req.headers["stripe-signature"];
  const secret  = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    console.error("STRIPE_WEBHOOK_SECRET not set");
    return res.status(500).json({ error: "Webhook secret not configured" });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, secret);
  } catch (err) {
    console.error("Stripe signature error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const obj = event.data.object;

  // ── checkout.session.completed ──────────────────────────────────────────
  if (event.type === "checkout.session.completed") {
    const clerkUserId = obj.metadata?.clerk_user_id;
    if (!clerkUserId) return res.json({ received: true });

    if (obj.mode === "payment") {
      try {
        // One-time credit pack — find the price from the line items
        const session = await stripe.checkout.sessions.retrieve(obj.id, {
          expand: ["line_items"],
        });
        const priceId = session.line_items?.data?.[0]?.price?.id;

        // SnapRouge access unlock
        if (SNAP_ROUGE_PRICE && priceId === SNAP_ROUGE_PRICE) {
          await supabaseAdmin
            .from("users")
            .update({ snaprouge_unlocked: true })
            .eq("clerk_user_id", clerkUserId);
          console.log(`🔓 SnapRouge unlocked → ${clerkUserId}`);
          return res.json({ received: true });
        }

        const credits = PRICE_CREDITS[priceId] ?? 0;
        if (credits > 0) {
          await addCredits(clerkUserId, credits);
          console.log(`💳 +${credits} credits (pack) → ${clerkUserId}`);
        }
      } catch (err) {
        console.error(`Stripe checkout session retrieve failed for ${obj.id}:`, err.message);
        // Return 200 so Stripe doesn't retry a session we cannot resolve.
        return res.json({ received: true, warning: err.message });
      }
    }
    // For subscriptions, wait for invoice.payment_succeeded / subscription.updated
  }

  // ── customer.subscription.updated / created ──────────────────────────────
  if (
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.created"
  ) {
    const priceId     = obj.items?.data?.[0]?.price?.id;
    const clerkUserId = obj.metadata?.clerk_user_id;
    if (!clerkUserId || !priceId) return res.json({ received: true });

    const plan    = PRICE_PLANS[priceId];
    const credits = PRICE_CREDITS[priceId] ?? 0;

    if (plan && credits > 0) {
      // Add plan credits to the existing balance rather than replacing it,
      // so survey rewards, referral bonuses, and packs are preserved.
      await addCredits(clerkUserId, credits);
      await supabaseAdmin
        .from("users")
        .update({ plan })
        .eq("clerk_user_id", clerkUserId);

      console.log(`🔄 Plan → ${plan}, +${credits} credits added for ${clerkUserId}`);
    } else if (plan) {
      await supabaseAdmin
        .from("users")
        .update({ plan })
        .eq("clerk_user_id", clerkUserId);
      console.log(`🔄 Plan → ${plan} for ${clerkUserId}`);
    }
  }

  // ── customer.subscription.deleted ───────────────────────────────────────
  if (event.type === "customer.subscription.deleted") {
    const clerkUserId = obj.metadata?.clerk_user_id;
    if (clerkUserId) {
      await supabaseAdmin
        .from("users")
        .update({ plan: "free" })
        .eq("clerk_user_id", clerkUserId);

      console.log(`❌ Subscription cancelled → plan=free for ${clerkUserId}`);
    }
  }

  res.json({ received: true });
});

// ── Helpers ──────────────────────────────────────────────────────────────────
async function addCredits(clerkUserId, amount) {
  // Use a Postgres function to atomically increment credits
  const { error } = await supabaseAdmin.rpc("increment_credits", {
    p_clerk_user_id: clerkUserId,
    p_amount: amount,
  });

  if (error) {
    // Fallback: read → add → write (not atomic but safe enough for low volume)
    console.warn("rpc increment_credits failed, using fallback:", error.message);
    const { data } = await supabaseAdmin
      .from("users")
      .select("credits")
      .eq("clerk_user_id", clerkUserId)
      .single();

    const current = data?.credits ?? 0;
    await supabaseAdmin
      .from("users")
      .update({ credits: current + amount })
      .eq("clerk_user_id", clerkUserId);
  }
}

export default router;
