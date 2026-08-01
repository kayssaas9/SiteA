import express from "express";
import webhookStripe from "../../server/routes/webhook-stripe.js";

// Stripe signs the exact raw request body. Vercel must not parse it before the
// shared webhook route calls stripe.webhooks.constructEvent().
export const config = {
  api: {
    bodyParser: false,
  },
};

const app = express();

// A Vercel function already represents /api/webhook/stripe. Normalize the
// internal URL so the shared router's POST "/" route matches in both Vercel
// and the full Express server.
app.use((req, _res, next) => {
  req.url = "/";
  next();
});

app.use("/", webhookStripe);

export default app;