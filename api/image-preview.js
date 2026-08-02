import express from "express";
import multer from "multer";
import { normalizeImage } from "../server/lib/generation.js";

export const config = {
  api: {
    bodyParser: false,
  },
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const app = express();

app.post("/", upload.single("image"), async (req, res) => {
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

export default function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  req.url = "/";
  return app(req, res);
}