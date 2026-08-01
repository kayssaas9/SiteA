import { cancelUserSubscription } from "../../server/lib/checkout.js";

function getBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return null;
    }
  }
  return req.body;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = getBody(req);
  if (!body) {
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  try {
    const result = await cancelUserSubscription(body.clerkUserId);
    return res.status(200).json(result);
  } catch (err) {
    console.error("Stripe cancellation error:", err.message);
    const statusCode = err.statusCode || 500;
    const message = statusCode >= 500
      ? "Impossible d'annuler l'abonnement pour le moment."
      : err.message;
    return res.status(statusCode).json({ error: message });
  }
}