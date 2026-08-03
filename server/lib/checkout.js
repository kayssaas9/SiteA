import { stripe } from "./stripe.js";
import { supabaseAdmin } from "./supabase.js";

const DISCOVERY_PROMO_CODE = "DECOUVERTE";
const DISCOVERY_PROMO_PERCENT = 20;
let discoveryPromotionCodePromise = null;

async function getDiscoveryPromotionCodeId() {
  if (discoveryPromotionCodePromise) return discoveryPromotionCodePromise;

  discoveryPromotionCodePromise = (async () => {
    const existing = await stripe.promotionCodes.list({
      code: DISCOVERY_PROMO_CODE,
      limit: 10,
    });
    const activePromotion = existing.data.find((promotionCode) => promotionCode.active);
    if (activePromotion) return activePromotion.id;

    if (existing.data.length > 0) {
      throw new Error("Le code promo DECOUVERTE n'est plus disponible.");
    }

    let coupon;
    try {
      coupon = await stripe.coupons.retrieve("astra_decouverte_20");
    } catch (error) {
      if (error?.code !== "resource_missing") throw error;
      coupon = await stripe.coupons.create({
        id: "astra_decouverte_20",
        name: "DECOUVERTE -20%",
        percent_off: DISCOVERY_PROMO_PERCENT,
        duration: "forever",
        metadata: { source: "astra", campaign: DISCOVERY_PROMO_CODE },
      });
    }

    const promotionCode = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code: DISCOVERY_PROMO_CODE,
      metadata: { source: "astra", campaign: DISCOVERY_PROMO_CODE },
    });
    return promotionCode.id;
  })().catch((error) => {
    discoveryPromotionCodePromise = null;
    throw error;
  });

  return discoveryPromotionCodePromise;
}

function getRequestOrigin(req) {
  const configuredOrigin = process.env.APP_URL?.replace(/\/$/, "");
  if (configuredOrigin) return configuredOrigin;

  const forwardedHost = req?.headers?.["x-forwarded-host"];
  const host = Array.isArray(forwardedHost)
    ? forwardedHost[0]
    : forwardedHost || req?.headers?.host;
  const forwardedProto = req?.headers?.["x-forwarded-proto"];
  const protocol = (Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto)
    || (req?.protocol === "http" ? "http" : "https");

  if (host) return `${protocol}://${host}`;
  if (process.env.REPLIT_DEV_DOMAIN) return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  return "http://localhost:5000";
}

export async function createCheckoutSession({
  priceId,
  clerkUserId,
  mode = "subscription",
  generationId,
  promotionCode,
  req,
}) {
  if (!priceId || !clerkUserId) {
    const error = new Error("priceId and clerkUserId are required");
    error.statusCode = 400;
    throw error;
  }

  if (!["subscription", "payment"].includes(mode)) {
    const error = new Error("mode must be subscription or payment");
    error.statusCode = 400;
    throw error;
  }

  if (promotionCode && (promotionCode !== DISCOVERY_PROMO_CODE || mode !== "subscription")) {
    const error = new Error("Code promo invalide ou non applicable.");
    error.statusCode = 400;
    throw error;
  }

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

    await supabaseAdmin
      .from("users")
      .update({ stripe_customer_id: customerId })
      .eq("clerk_user_id", clerkUserId);
  }

  const origin = getRequestOrigin(req);
  const metadata = {
    clerk_user_id: clerkUserId,
    ...(generationId ? { generation_id: generationId } : {}),
    ...(promotionCode ? { promotion_code: promotionCode } : {}),
  };
  const discount = promotionCode
    ? { discounts: [{ promotion_code: await getDiscoveryPromotionCodeId() }] }
    : {};
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    customer_email: user?.email || undefined,
    mode,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/generate?checkout=success`,
    cancel_url: `${origin}/pricing?checkout=cancelled`,
    metadata,
    ...discount,
    ...(mode === "subscription" && {
      subscription_data: { metadata },
    }),
  });

  return { url: session.url };
}

export async function cancelUserSubscription(clerkUserId) {
  if (!clerkUserId) {
    const error = new Error("clerkUserId is required");
    error.statusCode = 400;
    throw error;
  }

  const { data: user, error: userError } = await supabaseAdmin
    .from("users")
    .select("stripe_customer_id")
    .eq("clerk_user_id", clerkUserId)
    .single();

  if (userError || !user?.stripe_customer_id) {
    const error = new Error("Aucun abonnement trouvé.");
    error.statusCode = 404;
    throw error;
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
    const error = new Error("Aucun abonnement actif trouvé.");
    error.statusCode = 404;
    throw error;
  }

  await stripe.subscriptions.cancel(subscription.id);

  const { error: planError } = await supabaseAdmin
    .from("users")
    .update({
      plan: "free",
      credits: 0,
      snaprouge_unlocked: false,
    })
    .eq("clerk_user_id", clerkUserId);

  if (planError) throw planError;

  return { cancelled: true };
}