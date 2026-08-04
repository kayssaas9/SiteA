import express from "express";
import { getAdminDashboard, sendAdminOnly } from "../lib/admin.js";

const router = express.Router();

router.get("/", async (req, res) => {
  if (!await sendAdminOnly(req, res)) return;

  try {
    res.set("Cache-Control", "no-store");
    return res.json(await getAdminDashboard());
  } catch (error) {
    console.error("Admin dashboard error:", error.message);
    return res.status(500).json({ error: "Impossible de charger le tableau de bord admin." });
  }
});

export default router;