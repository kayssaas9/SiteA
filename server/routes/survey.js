import express from "express";
import { supabaseAdmin } from "../lib/supabase.js";
import { MAX_EXPERT_CREDITS } from "../lib/stripe.js";

const router = express.Router();

const QUESTIONS = [
  { id: "q1", text: "Comment évalueriez-vous la qualité des images générées ?" },
  { id: "q2", text: "L'interface est-elle facile à prendre en main ? Expliquez pourquoi." },
  { id: "q3", text: "La vitesse de génération vous convient-elle ?" },
  { id: "q4", text: "Les explications sur les crédits sont-elles claires ?" },
  { id: "q5", text: "Le processus de paiement est-il satisfaisant ?" },
  { id: "q6", text: "Quelle fonctionnalité utilisez-vous le plus et pourquoi ?" },
  { id: "q7", text: "Sur quel appareil utilisez-vous principalement Astra ?" },
  { id: "q8", text: "Comment avez-vous découvert Astra ?" },
  { id: "q9", text: "Recommanderiez-vous Astra à quelqu'un ? Pourquoi ?" },
  { id: "q10", text: "Le plan tarifaire vous semble-t-il adapté ?" },
  { id: "q11", text: "La page Historique est-elle utile ? Que pourrait-on améliorer ?" },
  { id: "q12", text: "Les animations et le design sont-ils agréables ?" },
  { id: "q13", text: "Le support client répond-il à vos attentes ?" },
  { id: "q14", text: "Qu'est-ce qui pourrait améliorer votre expérience sur Astra ?" },
  { id: "q15", text: "Quelle fonctionnalité aimeriez-vous voir ajoutée ?" },
];

const SUBSCRIBER_PLANS = new Set(["basic", "pro", "expert"]);

function isSubscriber(plan) {
  return SUBSCRIBER_PLANS.has(plan);
}

async function getUserForSurvey(clerkUserId) {
  return supabaseAdmin
    .from("users")
    .select("plan, survey_completed, credits")
    .eq("clerk_user_id", clerkUserId)
    .single();
}

function validateOpenAnswer(text) {
  if (!text || text.length < 20) return false;

  // Reject if same char repeated more than 4 times in a row.
  if (/(.)\1{4,}/.test(text)) return false;

  // At least 3 distinct words of at least 3 letters each.
  const words = text
    .toLowerCase()
    .replace(/[^a-zàâäéèêëïîôùûüç0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length >= 3);
  const unique = new Set(words);
  return unique.size >= 3;
}

/**
 * GET /api/survey/questions/:clerkUserId
 * Returns the survey question list.
 */
router.get("/questions/:clerkUserId", async (req, res) => {
  const { data, error } = await getUserForSurvey(req.params.clerkUserId);
  if (error || !data) return res.status(404).json({ error: "Utilisateur introuvable." });
  if (!isSubscriber(data.plan)) {
    return res.status(403).json({ error: "Le questionnaire est réservé aux abonnés." });
  }
  res.json(QUESTIONS);
});

/**
 * GET /api/survey/status/:clerkUserId
 * Returns whether the user has already completed the survey.
 */
router.get("/status/:clerkUserId", async (req, res) => {
  const { clerkUserId } = req.params;
  const { data, error } = await getUserForSurvey(clerkUserId);

  if (error) return res.status(404).json({ error: "User not found" });
  if (!isSubscriber(data.plan)) {
    return res.status(403).json({ error: "Le questionnaire est réservé aux abonnés." });
  }
  res.json({ completed: data.survey_completed ?? false });
});

/**
 * POST /api/survey/submit
 * Body: { clerkUserId, answers }
 */
router.post("/submit", express.json(), async (req, res) => {
  const { clerkUserId, answers } = req.body;

  if (!clerkUserId) {
    return res.status(400).json({ error: "Identifiant utilisateur manquant." });
  }

  if (!answers || typeof answers !== "object") {
    return res.status(400).json({ error: "Réponses manquantes." });
  }

  // Check the user row exists and survey is not already completed.
  const { data: userRow, error: userError } = await getUserForSurvey(clerkUserId);

  if (userError || !userRow) {
    return res.status(404).json({ error: "Utilisateur introuvable." });
  }

  if (!isSubscriber(userRow.plan)) {
    return res.status(403).json({ error: "Le questionnaire est réservé aux abonnés." });
  }

  if (userRow.survey_completed) {
    return res.status(403).json({ error: "Questionnaire déjà complété." });
  }

  // Validate all open-ended answers.
  const invalid = {};
  for (const q of QUESTIONS) {
    const text = answers[q.id];
    if (!validateOpenAnswer(text)) {
      invalid[q.id] = "Merci de détailler un peu plus ta réponse";
    }
  }

  if (Object.keys(invalid).length > 0) {
    return res.status(422).json({ invalid });
  }

  // Save the response.
  const { error: insertError } = await supabaseAdmin
    .from("survey_responses")
    .insert({ user_id: clerkUserId, answers });

  if (insertError) {
    console.error("survey insert error:", insertError);
    return res.status(500).json({ error: "Erreur lors de l'enregistrement du questionnaire." });
  }

  // Mark user as completed and credit 400 credits.
  const previousCredits = userRow.credits ?? 0;
  const newCredits = userRow.plan === "expert"
    ? Math.min(MAX_EXPERT_CREDITS, previousCredits + 400)
    : previousCredits + 400;
  console.log(`Crediting survey reward: ${clerkUserId}: ${previousCredits} → ${newCredits}`);
  const { error: updateError } = await supabaseAdmin
    .from("users")
    .update({ survey_completed: true, credits: newCredits })
    .eq("clerk_user_id", clerkUserId);

  if (updateError) {
    console.error("survey credit update error:", updateError);
    return res.status(500).json({ error: "Erreur lors du crédit des points." });
  }
  console.log(`✅ Survey reward credited: ${clerkUserId} now has ${newCredits} credits`);

  res.json({ success: true, creditsEarned: 400, newCredits });
});

export default router;
