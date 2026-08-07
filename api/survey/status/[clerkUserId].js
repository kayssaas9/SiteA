import { supabaseAdmin } from "../../../server/lib/supabase.js";

const SUBSCRIBER_PLANS = new Set(["basic", "pro", "expert"]);

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { clerkUserId } = req.query;
  if (!clerkUserId) return res.status(400).json({ error: "clerkUserId is required" });

  const { data, error } = await supabaseAdmin
    .from("users")
    .select("plan, survey_completed")
    .eq("clerk_user_id", clerkUserId)
    .single();

  if (error || !data) return res.status(404).json({ error: "User not found" });

  if (!SUBSCRIBER_PLANS.has(data.plan)) {
    return res.status(403).json({ error: "Le questionnaire est réservé aux abonnés." });
  }

  return res.status(200).json({ completed: data.survey_completed ?? false });
}
