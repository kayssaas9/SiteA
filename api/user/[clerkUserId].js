import { supabaseAdmin } from "../../server/lib/supabase.js";

function disableCaching(res) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
}

export default async function handler(req, res) {
  disableCaching(res);

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { clerkUserId } = req.query;
  if (!clerkUserId) {
    return res.status(400).json({ error: "clerkUserId is required" });
  }

  const { data, error } = await supabaseAdmin
    .from("users")
    .select("plan, credits, email, snaprouge_unlocked, survey_completed")
    .eq("clerk_user_id", clerkUserId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return res.status(404).json({ error: "User not found" });
    }
    console.error("user data error:", error);
    return res.status(500).json({ error: "Unable to load user data" });
  }

  return res.status(200).json(data);
}