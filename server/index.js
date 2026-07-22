import express from "express";
import cors from "cors";
import multer from "multer";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

import webhookClerk  from "./routes/webhook-clerk.js";
import webhookStripe from "./routes/webhook-stripe.js";
import checkoutRoute from "./routes/checkout.js";
import userRoute     from "./routes/user.js";
import historyRoute  from "./routes/history.js";

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

// ── OneShotAPI image generation proxy ────────────────────────────────────────
const ONESHOT_BASE_URL = "https://oneshotapi.com";
const ONESHOT_API_KEY  = process.env.ONESHOT_API_KEY;

app.post("/api/generate", upload.single("image"), async (req, res) => {
  try {
    const { mode, prompt, clerk_user_id } = req.body;

    if (!ONESHOT_API_KEY) {
      return res.status(500).json({ error: "Clé OneShotAPI non configurée." });
    }

    const endpoint =
      mode === "outfit"
        ? `${ONESHOT_BASE_URL}/api/tryon`
        : `${ONESHOT_BASE_URL}/api/generate`;

    const formData = new FormData();
    formData.append("prompt", prompt || "");
    formData.append("mode", mode || "outfit");

    if (req.file) {
      const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
      formData.append("image", blob, req.file.originalname);
    }

    const apiRes = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${ONESHOT_API_KEY}` },
      body: formData,
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      return res.status(apiRes.status).json({
        error: `OneShotAPI a retourné ${apiRes.status}: ${errText}`,
      });
    }

    const data = await apiRes.json();
    const imageUrl = data.url ?? data.image_url ?? data.output ?? data.result ?? null;

    if (!imageUrl) {
      return res.status(500).json({ error: "URL de l'image introuvable dans la réponse OneShotAPI.", raw: data });
    }

    // Save generation history if a user is identified.
    if (clerk_user_id && clerk_user_id.trim() !== "") {
      const { error: saveError } = await supabaseAdmin
        .from("generations")
        .insert({ clerk_user_id, mode, prompt: prompt || "", image_url: imageUrl });
      if (saveError) console.error("Failed to save generation history:", saveError);
    }

    return res.json({ imageUrl });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// ── Health check ─────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// ── Serve built React app in production ──────────────────────────────────────
const clientDist = path.join(__dirname, "../client/dist");
app.use(express.static(clientDist));
app.get("*", (_req, res) => res.sendFile(path.join(clientDist, "index.html")));

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
