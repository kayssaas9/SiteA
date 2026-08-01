import { supabaseAdmin } from "../../server/lib/supabase.js";
import { getOrCreateUserCode } from "../../server/routes/referral.js";

function disableCaching(res) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
}

export default async function handler(req, res) {
  disableCaching(res);

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { clerkUserId, email } = req.body || {};
  if (!clerkUserId || !email) {
    return res.status(400).json({ error: "clerkUserId and email are required" });
  }

  let userRow = await supabaseAdmin
    .from("users")
    .select("plan, credits, email, snaprouge_unlocked, survey_completed")
    .eq("clerk_user_id", clerkUserId)
    .single();

  if (userRow.error && userRow.error.code !== "PGRST116") {
    console.error("ensure user error:", userRow.error);
    return res.status(500).json({ error: "Unable to ensure user" });
  }

  if (!userRow.data) {
    const insertRes = await supabaseAdmin
      .from("users")
      .insert({
        clerk_user_id: clerkUserId,
        email,
        plan: "free",
        credits: 0,
        snaprouge_unlocked: false,
        survey_completed: false,
      })
      .select("plan, credits, email, snaprouge_unlocked, survey_completed")
      .single();

    if (insertRes.error) {
      console.error("ensure user insert error:", insertRes.error);
      return res.status(500).json({ error: "Unable to create user" });
    }
    userRow = insertRes;
  }

  try {
    await getOrCreateUserCode(clerkUserId);
  } catch (codeErr) {
    console.error("ensure referral code error:", codeErr);
  }

  return res.status(200).json(userRow.data);
}