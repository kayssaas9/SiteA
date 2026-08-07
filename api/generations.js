import { getGenerationImage, getGenerationStatus } from "../server/lib/generation.js";

export default function handler(req, res) {
  const route = Array.isArray(req.query?.route) ? req.query.route[0] : req.query?.route;
  const generationId = Array.isArray(req.query?.generationId)
    ? req.query.generationId[0]
    : req.query?.generationId;

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const clerkUserId = Array.isArray(req.query?.clerkUserId)
    ? req.query.clerkUserId[0]
    : req.query?.clerkUserId;
  if (!generationId || !clerkUserId) {
    return res.status(400).json({ error: "generationId and clerkUserId are required" });
  }

  return (async () => {
    try {
      if (route === "image") {
        const image = await getGenerationImage(generationId, clerkUserId);
        res.setHeader("Content-Type", image.contentType);
        res.setHeader("Cache-Control", "private, max-age=3600");
        res.setHeader("Content-Length", String(image.buffer.length));
        return res.status(200).send(image.buffer);
      }
      if (route !== "status") return res.status(404).json({ error: "Not found" });
      return res.status(200).json(await getGenerationStatus(generationId, clerkUserId));
    } catch (error) {
      return res.status(error.statusCode || 500).json({ error: error.message });
    }
  })();
}