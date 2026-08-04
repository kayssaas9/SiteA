import { getAdminDashboard, sendAdminOnly } from "../server/lib/admin.js";
export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const admin = await sendAdminOnly(req, res);
  if (!admin) return;

  try {
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json(await getAdminDashboard());
  } catch (error) {
    console.error("Admin dashboard error:", error.message);
    return res.status(500).json({ error: "Impossible de charger le tableau de bord admin." });
  }
}