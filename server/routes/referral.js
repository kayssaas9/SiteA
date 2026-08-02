import express from "express";
import { supabaseAdmin } from "../lib/supabase.js";
import { MAX_EXPERT_CREDITS } from "../lib/stripe.js";

const router = express.Router();

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function generateCode(length = 7) {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return code;
}

async function ensureUniqueCode(retries = 10) {
  for (let i = 0; i < retries; i++) {
    const code = generateCode();
    const { data } = await supabaseAdmin
      .from("users")
      .select("referral_code")
      .eq("referral_code", code)
      .maybeSingle();
    if (!data) return code;
  }
  throw new Error("Unable to generate unique referral code");
}

async function getOrCreateUserCode(clerkUserId) {
  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("referral_code")
    .eq("clerk_user_id", clerkUserId)
    .single();

  if (existing?.referral_code) return existing.referral_code;

  const code = await ensureUniqueCode();
  const { error } = await supabaseAdmin
    .from("users")
    .update({ referral_code: code })
    .eq("clerk_user_id", clerkUserId);

  if (error) throw error;
  return code;
}

/**
 * POST /api/referral/apply
 * Body: { clerkUserId, referralCode }
 * Applies a referral code to a new user. Idempotent: if the user already has a
 * referred_by or the code is invalid, returns a clear status without crediting twice.
 */
router.post("/apply", express.json(), async (req, res) => {
  const { clerkUserId, referralCode } = req.body;

  if (!clerkUserId || !referralCode) {
    return res.status(400).json({ error: "Identifiant ou code de parrainage manquant." });
  }

  // Normalize code.
  const code = String(referralCode).trim();

  // Find the referrer.
  const { data: referrer, error: referrerError } = await supabaseAdmin
    .from("users")
    .select("clerk_user_id, credits")
    .eq("referral_code", code)
    .single();

  if (referrerError || !referrer) {
    return res.status(404).json({ error: "Code de parrainage invalide." });
  }

  // Prevent self-referral.
  if (referrer.clerk_user_id === clerkUserId) {
    return res.status(400).json({ error: "Vous ne pouvez pas utiliser votre propre code." });
  }

  // Get or create the referee row.
  const { data: referee, error: refereeError } = await supabaseAdmin
    .from("users")
    .select("clerk_user_id, plan, credits, referred_by")
    .eq("clerk_user_id", clerkUserId)
    .single();

  if (refereeError || !referee) {
    return res.status(404).json({ error: "Utilisateur introuvable." });
  }

  // Already referred by someone: don't change it or credit again.
  if (referee.referred_by) {
    return res.json({ applied: false, reason: "Vous avez déjà un parrain." });
  }

  // Apply the referral in a single upsert + credit update.
  const refereeCredits = referee.credits ?? 0;
  const newRefereeCredits = referee.plan === "expert"
    ? Math.min(MAX_EXPERT_CREDITS, refereeCredits + 100)
    : refereeCredits + 100;

  const { error: updateError } = await supabaseAdmin
    .from("users")
    .update({ referred_by: referrer.clerk_user_id, credits: newRefereeCredits })
    .eq("clerk_user_id", clerkUserId);

  if (updateError) {
    console.error("referral apply user update error:", updateError);
    return res.status(500).json({ error: "Erreur lors de l'application du parrainage." });
  }

  const { error: referralError } = await supabaseAdmin
    .from("referrals")
    .insert({ referrer_id: referrer.clerk_user_id, referred_id: clerkUserId, reward_granted: false });

  if (referralError) {
    console.error("referral insert error:", referralError);
    return res.status(500).json({ error: "Erreur lors de l'enregistrement du parrainage." });
  }

  res.json({ applied: true, welcomeCredits: 100, newCredits: newRefereeCredits });
});

/**
 * GET /api/referral/:clerkUserId
 * Returns the user's referral code and stats.
 */
router.get("/:clerkUserId", async (req, res) => {
  const { clerkUserId } = req.params;

  try {
    const code = await getOrCreateUserCode(clerkUserId);

    const { data: referrals, error: refError } = await supabaseAdmin
      .from("referrals")
      .select("reward_granted")
      .eq("referrer_id", clerkUserId);

    if (refError) throw refError;

    const referralCount = referrals?.length ?? 0;
    const creditsEarned = (referrals?.filter((r) => r.reward_granted).length ?? 0) * 200;

    res.json({ referralCode: code, referralCount, creditsEarned });
  } catch (err) {
    console.error("referral stats error:", err);
    res.status(500).json({ error: err.message });
  }
});

export { getOrCreateUserCode };
export default router;
