import express from "express";
import cors from "cors";
import multer from "multer";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

// Multer: store uploads in memory as buffers
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ─── OneShotAPI proxy ────────────────────────────────────────────────────────
// Update ONESHOT_BASE_URL and the request body shape to match the exact
// OneShotAPI endpoint you want to use (check oneshotapi.com/docs for details).
const ONESHOT_BASE_URL = "https://oneshotapi.com";
const ONESHOT_API_KEY = process.env.ONESHOT_API_KEY;

/**
 * POST /api/generate
 * Body (multipart/form-data):
 *   - mode:   "outfit" | "car"
 *   - prompt: text description of the desired result
 *   - image:  uploaded file (optional – for try-on / replacement)
 *
 * Returns: { imageUrl: string } or { error: string }
 */
app.post("/api/generate", upload.single("image"), async (req, res) => {
  try {
    const { mode, prompt } = req.body;

    if (!ONESHOT_API_KEY) {
      return res.status(500).json({ error: "OneShotAPI key not configured." });
    }

    // ── Build the request to OneShotAPI ─────────────────────────────────────
    // Adjust the endpoint path and body to match the API docs for each mode.
    const endpoint =
      mode === "outfit"
        ? `${ONESHOT_BASE_URL}/api/tryon`   // virtual try-on endpoint
        : `${ONESHOT_BASE_URL}/api/generate`; // image generation / replacement

    const formData = new FormData();
    formData.append("prompt", prompt || "");
    formData.append("mode", mode || "outfit");

    if (req.file) {
      // Attach the uploaded image as a Blob
      const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
      formData.append("image", blob, req.file.originalname);
    }

    const apiRes = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ONESHOT_API_KEY}`,
        // Content-Type is set automatically by fetch when using FormData
      },
      body: formData,
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      console.error("OneShotAPI error:", apiRes.status, errText);
      return res.status(apiRes.status).json({
        error: `OneShotAPI returned ${apiRes.status}: ${errText}`,
      });
    }

    const data = await apiRes.json();

    // ── Normalise the response ───────────────────────────────────────────────
    // OneShotAPI may return { url }, { image_url }, { output }, etc.
    // Update this line to match the actual response shape.
    const imageUrl =
      data.url ?? data.image_url ?? data.output ?? data.result ?? null;

    if (!imageUrl) {
      console.error("Unexpected OneShotAPI response:", data);
      return res.status(500).json({
        error: "Could not find image URL in OneShotAPI response.",
        raw: data,
      });
    }

    return res.json({ imageUrl });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// ─── Health check ────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// ─── Serve built React app in production ─────────────────────────────────────
const clientDist = path.join(__dirname, "../client/dist");
app.use(express.static(clientDist));
app.get("*", (_req, res) =>
  res.sendFile(path.join(clientDist, "index.html"))
);

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
