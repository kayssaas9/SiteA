import express from "express";
import { getGenerationImage, getGenerationStatus } from "../lib/generation.js";

const router = express.Router();

router.get("/:generationId/image", async (req, res) => {
  const { generationId } = req.params;
  const { clerkUserId } = req.query;

  if (!clerkUserId) {
    return res.status(400).json({ error: "clerkUserId is required" });
  }

  try {
    const image = await getGenerationImage(generationId, clerkUserId);
    res.set({
      "Content-Type": image.contentType,
      "Cache-Control": "private, max-age=3600",
      "Content-Length": String(image.buffer.length),
    });
    return res.send(image.buffer);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.message });
  }
});

router.get("/:generationId", async (req, res) => {
  const { generationId } = req.params;
  const { clerkUserId } = req.query;

  if (!clerkUserId) {
    return res.status(400).json({ error: "clerkUserId is required" });
  }

  try {
    return res.json(await getGenerationStatus(generationId, clerkUserId));
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.message });
  }
});

export default router;