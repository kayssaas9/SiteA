import express from "express";
import multer from "multer";
import { createGeneration } from "../server/lib/generation.js";

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

// A Vercel function already represents /api/generate. Normalize the internal
// URL so the shared POST "/" route matches the request in production.
app.use((req, _res, next) => {
  req.url = "/";
  next();
});

app.post("/", upload.fields([
  { name: "image", maxCount: 1 },
  { name: "reference_1", maxCount: 1 },
  { name: "reference_2", maxCount: 1 },
]), createGeneration);

export default function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  return app(req, res);
}