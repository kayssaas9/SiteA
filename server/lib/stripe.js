import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) throw new Error("Missing STRIPE_SECRET_KEY");

export const stripe = new Stripe(key, { apiVersion: "2024-06-20" });

// ── Credit amounts per product ────────────────────────────────────────────────
// Map Stripe price IDs → credit grants.
// Set these via Replit Secrets or env vars.
export const PRICE_CREDITS = {
  // Subscriptions
  [process.env.STRIPE_PRICE_BASIC]:   2500,
  [process.env.STRIPE_PRICE_PRO]:     7500,
  [process.env.STRIPE_PRICE_EXPERT]:  15000,
  // One-time credit packs
  [process.env.STRIPE_PRICE_PACK_4K]:  4000,
  [process.env.STRIPE_PRICE_PACK_8K]:  8500,
  [process.env.STRIPE_PRICE_PACK_20K]: 20000,
};

// Plans keyed by price ID
export const PRICE_PLANS = {
  [process.env.STRIPE_PRICE_BASIC]:  "basic",
  [process.env.STRIPE_PRICE_PRO]:    "pro",
  [process.env.STRIPE_PRICE_EXPERT]: "expert",
};
