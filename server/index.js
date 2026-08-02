import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

import webhookClerk  from "./routes/webhook-clerk.js";
import webhookStripe from "./routes/webhook-stripe.js";
import checkoutRoute from "./routes/checkout.js";
import userRoute     from "./routes/user.js";
import historyRoute  from "./routes/history.js";
import surveyRoute   from "./routes/survey.js";
import referralRoute from "./routes/referral.js";
import generationsRoute from "./routes/generations.js";
import { createGeneration } from "./lib/generation.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app  = express();
const PORT = process.env.PORT || 3001;

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

app.use(cors());

// ── Webhook routes need raw body — mount BEFORE express.json ─────────────────
app.use("/api/webhook/stripe", webhookStripe);   // raw body handled inside route
app.use("/api/webhook/clerk",  webhookClerk);    // raw body handled inside route

// ── JSON middleware for everything else ──────────────────────────────────────
app.use(express.json({ limit: "10mb" }));

// ── API routes ───────────────────────────────────────────────────────────────
app.use("/api/checkout", checkoutRoute);
app.use("/api/user",     userRoute);
app.use("/api/history",  historyRoute);
app.use("/api/survey",   surveyRoute);
app.use("/api/referral", referralRoute);
app.use("/api/generations", generationsRoute);

app.post("/api/generate", upload.fields([
  { name: "image", maxCount: 1 },
  { name: "reference_1", maxCount: 1 },
  { name: "reference_2", maxCount: 1 },
]), createGeneration);

// ── Health check ─────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// ── Serve built React app in production ──────────────────────────────────────
const clientDist = path.join(__dirname, "../client/dist");
app.use(express.static(clientDist));
app.get("*", (_req, res) => res.sendFile(path.join(clientDist, "index.html")));

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
