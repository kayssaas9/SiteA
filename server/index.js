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
import adminRoute      from "./routes/admin.js";
import { createGeneration, normalizeImage } from "./lib/generation.js";

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
app.use("/api/admin",     adminRoute);

app.post("/api/image-preview", upload.single("image"), async (req, res) => {
  if (!req.file?.buffer) {
    return res.status(400).json({ error: "Image manquante." });
  }

  try {
    const normalizedBuffer = await normalizeImage(req.file.buffer);
    return res.json({
      preview: `data:image/jpeg;base64,${normalizedBuffer.toString("base64")}`,
    });
  } catch (error) {
    console.error("Image preview normalization failed:", error.message);
    return res.status(422).json({
      error: "Cette image ne peut pas être prévisualisée. Elle sera tout de même testée lors de la génération.",
    });
  }
});

app.post("/api/generate", upload.fields([
  { name: "image", maxCount: 1 },
  { name: "reference_1", maxCount: 1 },
  { name: "reference_2", maxCount: 1 },
]), createGeneration);

// Keep multipart failures JSON-shaped so mobile clients never receive an HTML
// error page or a stringified object such as "[object Object]".
app.use((error, _req, res, _next) => {
  console.error("Multipart upload failed:", error);
  const status = error?.code === "LIMIT_FILE_SIZE" ? 413 : 400;
  return res.status(status).json({
    error: status === 413
      ? "Cette image dépasse la limite de 10 Mo."
      : "Le fichier envoyé est invalide. Réessaie avec une autre photo.",
  });
});

// ── Health check ─────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// ── Serve built React app in production ──────────────────────────────────────
const clientDist = path.join(__dirname, "../client/dist");
app.use(express.static(clientDist));
app.get("*", (_req, res) => res.sendFile(path.join(clientDist, "index.html")));

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
