import { supabaseAdmin } from "../../server/lib/supabase.js";
import { MAX_EXPERT_CREDITS } from "../../server/lib/stripe.js";

const SUBSCRIBER_PLANS = new Set(["basic", "pro", "expert"]);

const QUESTIONS = [
  { id: "q1" }, { id: "q2" }, { id: "q3" }, { id: "q4" }, { id: "q5" },
  { id: "q6" }, { id: "q7" }, { id: "q8" }, { id: "q9" }, { id: "q10" },
  { id: "q11" }, { id: "q12" }, { id: "q13" }, { id: "q14" }, { id: "q15" },
];

function validateOpenAnswer(text) {
  if (!text || text.length < 20) return false;
  if (/(.)\1{4,}/.test(text)) return false;
  const words = text
    .toLowerCase()
    .replace(/[^a-zàâäéèêëïîôùûüç0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length >= 3);
  return new Set(words).size >= 3;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { clerkUserId, answers } = req.body ?? {};

  if (!clerkUserId) return res.status(400).json({ error: "Identifiant utilisateur manquant." });
  if (!answers || typeof answers !== "object") return res.status(400).json({ error: "Réponses manquantes." });

  const { data: userRow, error: userError } = await supabaseAdmin
    .from("users")
    .select("plan, survey_completed, credits")
    .eq("clerk_user_id", clerkUserId)
    .single();

  if (userError || !userRow) return res.status(404).json({ error: "Utilisateur introuvable." });
  if (!SUBSCRIBER_PLANS.has(userRow.plan)) return res.status(403).json({ error: "Le questionnaire est réservé aux abonnés." });
  if (userRow.survey_completed) return res.status(403).json({ error: "Questionnaire déjà complété." });

  // Validate all answers
  const invalid = {};
  for (const q of QUESTIONS) {
    if (!validateOpenAnswer(answers[q.id])) {
      invalid[q.id] = "Merci de détailler un peu plus ta réponse";
    }
  }
  if (Object.keys(invalid).length > 0) return res.status(422).json({ invalid });

  // Save responses
  const { error: insertError } = await supabaseAdmin
    .from("survey_responses")
    .insert({ user_id: clerkUserId, answers });

  if (insertError) {
    console.error("survey insert error:", insertError);
    return res.status(500).json({ error: "Erreur lors de l'enregistrement du questionnaire." });
  }

  // Credit 400 points
  const previousCredits = userRow.credits ?? 0;
  const newCredits = userRow.plan === "expert"
    ? Math.min(MAX_EXPERT_CREDITS, previousCredits + 400)
    : previousCredits + 400;

  const { error: updateError } = await supabaseAdmin
    .from("users")
    .update({ survey_completed: true, credits: newCredits })
    .eq("clerk_user_id", clerkUserId);

  if (updateError) {
    console.error("survey credit update error:", updateError);
    return res.status(500).json({ error: "Erreur lors du crédit des points." });
  }

  console.log(`✅ Survey reward credited: ${clerkUserId} now has ${newCredits} credits`);
  return res.status(200).json({ success: true, creditsEarned: 400, newCredits });
}
