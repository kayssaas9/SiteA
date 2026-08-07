import { getGenerationImage, getGenerationStatus } from "../../server/lib/generation.js";

function getPath(req) {
  const value = req.query?.path;
  return (Array.isArray(value) ? value : value ? [value] : []).map((part) => {
    try {
      return decodeURIComponent(part);
    } catch {
      return part;
    }
  });
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const path = getPath(req);
  const generationId = path[0];
  const clerkUserId = Array.isArray(req.query?.clerkUserId)
    ? req.query.clerkUserId[0]
    : req.query?.clerkUserId;

  if (!generationId || !clerkUserId) {
    return res.status(400).json({ error: "generationId and clerkUserId are required" });
  }

  try {
    if (path[1] === "image") {
      const image = await getGenerationImage(generationId, clerkUserId);
      res.setHeader("Content-Type", image.contentType);
      res.setHeader("Cache-Control", "private, max-age=3600");
      res.setHeader("Content-Length", String(image.buffer.length));
      return res.status(200).send(image.buffer);
    }

    if (path.length !== 1) return res.status(404).json({ error: "Not found" });
    return res.status(200).json(await getGenerationStatus(generationId, clerkUserId));
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.message });
  }
}