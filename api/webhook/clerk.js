import express from "express";
import webhookClerk from "../../server/routes/webhook-clerk.js";

// Vercel must leave the request body untouched so the existing Svix
// verification can validate the exact payload sent by Clerk.
export const config = {
  api: {
    bodyParser: false,
  },
};

const app = express();

// A Vercel function already represents /api/webhook/clerk. Normalize the
// internal URL so the shared router's POST "/" route matches in both Vercel
// and the full Express server.
app.use((req, _res, next) => {
  req.url = "/";
  next();
});

app.use("/", webhookClerk);

export default app;