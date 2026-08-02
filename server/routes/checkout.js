import express from "express";
import {
  cancelUserSubscription,
  createCheckoutSession,
} from "../lib/checkout.js";

const router = express.Router();

/**
 * POST /api/checkout
 * Body: { priceId, clerkUserId, mode: "subscription" | "payment" }
 * Returns: { url } — redirect the user to this Stripe Checkout URL.
 */
router.post("/", async (req, res) => {
  try {
    const { priceId, clerkUserId, mode, generationId } = req.body || {};
    const result = await createCheckoutSession({
      priceId,
      clerkUserId,
      mode,
      generationId,
      req,
    });
    res.json(result);
  } catch (err) {
    console.error("Stripe checkout error:", err.message);
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

/**
 * POST /api/checkout/cancel-subscription
 * Body: { clerkUserId }
 *
 * Cancels the active subscription immediately and removes the subscription
 * plan from the local account. Credits already purchased or granted remain.
 */
router.post("/cancel-subscription", async (req, res) => {
  try {
    const { clerkUserId } = req.body || {};
    const result = await cancelUserSubscription(clerkUserId);
    res.json(result);
  } catch (err) {
    console.error("Stripe cancellation error:", err.message);
    const statusCode = err.statusCode || 500;
    const message = statusCode >= 500
      ? "Impossible d'annuler l'abonnement pour le moment."
      : err.message;
    res.status(statusCode).json({ error: message });
  }
});

export default router;
