import express from "express";
import { getGenerationStatus } from "../lib/generation.js";

const router = express.Router();

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