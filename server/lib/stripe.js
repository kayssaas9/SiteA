import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) throw new Error("Missing STRIPE_SECRET_KEY");

export const stripe = new Stripe(key, { apiVersion: "2024-06-20" });

// ── Credit amounts per product ────────────────────────────────────────────────
// Map Stripe price IDs → credit grants.
// Set these via Replit Secrets (VITE_STRIPE_PRICE_*).
export const PRICE_CREDITS = {
  // Monthly subscriptions
  [process.env.VITE_STRIPE_PRICE_BASIQUE]: 2500,
  [process.env.VITE_STRIPE_PRICE_PRO]:     7500,
  [process.env.VITE_STRIPE_PRICE_EXPERT]:  20000,
  // Annual subscriptions (same monthly credit grant)
  [process.env.VITE_STRIPE_PRICE_BASIQUE_ANNUEL]: 2500,
  [process.env.VITE_STRIPE_PRICE_PRO_ANNUEL]:     7500,
  [process.env.VITE_STRIPE_PRICE_EXPERT_ANNUEL]:  20000,
  // One-time credit packs for subscribers
  [process.env.VITE_STRIPE_PRICE_PACK_4K]:  4500,
  [process.env.VITE_STRIPE_PRICE_PACK_10K]: 10000,
  [process.env.VITE_STRIPE_PRICE_PACK_20K]: 20000,
  // One-time credit packs for non-subscribers
  [process.env.VITE_STRIPE_PRICE_PACK_800]: 900,
  [process.env.VITE_STRIPE_PRICE_PACK_2K]: 2000,
};

// Expert is marketed as unlimited, but its server-side credit balance is capped
// at 20,000 credits.
export const MAX_EXPERT_CREDITS = 20000;

// Plans keyed by price ID (monthly and annual variants map to the same plan)
export const PRICE_PLANS = {
  [process.env.VITE_STRIPE_PRICE_BASIQUE]:        "basic",
  [process.env.VITE_STRIPE_PRICE_BASIQUE_ANNUEL]: "basic",
  [process.env.VITE_STRIPE_PRICE_PRO]:            "pro",
  [process.env.VITE_STRIPE_PRICE_PRO_ANNUEL]:     "pro",
  [process.env.VITE_STRIPE_PRICE_EXPERT]:           "expert",
  [process.env.VITE_STRIPE_PRICE_EXPERT_ANNUEL]:  "expert",
};

// One-time SnapRouge access unlock price ID
export const SNAP_ROUGE_PRICE = process.env.VITE_STRIPE_PRICE_SNAPROUGE;
