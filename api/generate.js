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
app.post("/", upload.fields([
  { name: "image", maxCount: 1 },
  { name: "reference_1", maxCount: 1 },
  { name: "reference_2", maxCount: 1 },
]), createGeneration);

export default app;