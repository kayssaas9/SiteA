import express from "express";
import {
  stripe,
  PRICE_CREDITS,
  PRICE_PLANS,
  SNAP_ROUGE_PRICE,
  MAX_EXPERT_CREDITS,
} from "../lib/stripe.js";
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
          await unlockGeneration(clerkUserId, obj.metadata?.generation_id);
          console.log(`🔓 SnapRouge unlocked → ${clerkUserId}`);
          return res.json({ received: true });
        }

        const credits = PRICE_CREDITS[priceId] ?? 0;
        if (credits > 0) {
          await addCredits(clerkUserId, credits);
          await unlockGeneration(clerkUserId, obj.metadata?.generation_id);
          console.log(`💳 +${credits} credits (pack) → ${clerkUserId}`);
        }
      } catch (err) {
        console.error(`Stripe checkout session retrieve failed for ${obj.id}:`, err.message);
        // Return 200 so Stripe doesn't retry a session we cannot resolve.
        return res.json({ received: true, warning: err.message });
      }
    }

    // For subscriptions, also process credits here as a fallback/reliability layer.
    // The subscription webhook events are still handled below for non-Checkout flows.
    if (obj.mode === "subscription") {
      try {
        const session = await stripe.checkout.sessions.retrieve(obj.id, {
          expand: ["subscription"],
        });
        const subscription = session.subscription;
        if (subscription) {
          await processSubscription(subscription, clerkUserId, obj.metadata?.generation_id);
        }
      } catch (err) {
        console.error(`Subscription checkout session retrieve failed for ${obj.id}:`, err.message);
        return res.json({ received: true, warning: err.message });
      }
    }
  }

  // ── customer.subscription.updated / created ──────────────────────────────
  if (
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.created"
  ) {
    const clerkUserId = obj.metadata?.clerk_user_id;
    if (!clerkUserId) return res.json({ received: true });

    await processSubscription(obj, clerkUserId, obj.metadata?.generation_id);
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
async function processSubscription(subscription, clerkUserId, generationId) {
  const priceId = subscription.items?.data?.[0]?.price?.id;
  if (!priceId) return false;

  const plan = PRICE_PLANS[priceId];
  const credits = PRICE_CREDITS[priceId] ?? 0;

  if (!plan) return false;

  // Idempotency: record the subscription so we never credit the same one twice
  // across checkout.session.completed and customer.subscription.updated events.
  const { error: insertError } = await supabaseAdmin
    .from("subscription_credits")
    .insert({
      subscription_id: subscription.id,
      clerk_user_id: clerkUserId,
      plan,
      credits_added: credits,
    });

  if (insertError && insertError.code === "23505") {
    console.log(`⏭ Subscription ${subscription.id} already credited, skipping.`);
    // Still ensure the plan field is up to date in case it was changed manually.
    await supabaseAdmin.from("users").update({ plan }).eq("clerk_user_id", clerkUserId);
    await unlockGeneration(clerkUserId, generationId);
    return true;
  }

  if (insertError) {
    console.error("Failed to record subscription credit:", insertError);
    return false;
  }

  const { data: account } = await supabaseAdmin
    .from("users")
    .select("credits")
    .eq("clerk_user_id", clerkUserId)
    .single();
  const planUpdate = { plan };
  if (plan === "expert") {
    planUpdate.credits = Math.min(MAX_EXPERT_CREDITS, account?.credits ?? 0);
  }

  await supabaseAdmin
    .from("users")
    .update(planUpdate)
    .eq("clerk_user_id", clerkUserId);

  if (credits > 0) {
    await addCredits(clerkUserId, credits);
  }
  await unlockGeneration(clerkUserId, generationId);

  console.log(`🔄 Plan → ${plan}, +${credits} credits added for ${clerkUserId} (subscription ${subscription.id})`);
  return true;
}

async function addCredits(clerkUserId, amount) {
  const { data: currentUser } = await supabaseAdmin
    .from("users")
    .select("plan, credits")
    .eq("clerk_user_id", clerkUserId)
    .single();
  const cappedAmount = currentUser?.plan === "expert"
    ? Math.max(0, Math.min(amount, MAX_EXPERT_CREDITS - (currentUser.credits ?? 0)))
    : amount;

  if (cappedAmount <= 0) return;

  // Use a Postgres function to atomically increment credits
  const { error } = await supabaseAdmin.rpc("increment_credits", {
    p_clerk_user_id: clerkUserId,
    p_amount: cappedAmount,
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
    const plan = currentUser?.plan;
    const nextCredits = plan === "expert"
      ? Math.min(MAX_EXPERT_CREDITS, current + cappedAmount)
      : current + cappedAmount;
    await supabaseAdmin
      .from("users")
      .update({ credits: nextCredits })
      .eq("clerk_user_id", clerkUserId);
  }
}

async function unlockGeneration(clerkUserId, generationId) {
  if (!generationId) {
    console.log(`⏭ No teaser generation attached to payment → ${clerkUserId}`);
    return true;
  }

  const { error } = await supabaseAdmin
    .from("generations")
    .update({ unlocked: true })
    .eq("clerk_user_id", clerkUserId)
    .eq("id", generationId)
    .eq("unlocked", false)
    .in("status", ["processing", "finalizing", "completed"]);

  if (error) {
    console.error(`Failed to unlock generation ${generationId} for ${clerkUserId}:`, error.message);
    return false;
  }

  console.log(`🔓 Teaser generation unlocked → ${generationId} (${clerkUserId})`);
  return true;
}

export default router;
