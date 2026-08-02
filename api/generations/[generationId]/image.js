import { getGenerationImage } from "../../../server/lib/generation.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const generationId = Array.isArray(req.query.generationId)
    ? req.query.generationId[0]
    : req.query.generationId;
  const clerkUserId = Array.isArray(req.query.clerkUserId)
    ? req.query.clerkUserId[0]
    : req.query.clerkUserId;

  if (!generationId || !clerkUserId) {
    return res.status(400).json({ error: "generationId and clerkUserId are required" });
  }

  try {
    const image = await getGenerationImage(generationId, clerkUserId);
    res.setHeader("Content-Type", image.contentType);
    res.setHeader("Cache-Control", "private, max-age=3600");
    res.setHeader("Content-Length", String(image.buffer.length));
    return res.status(200).send(image.buffer);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.message });
  }
}