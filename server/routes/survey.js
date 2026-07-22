import express from "express";
import { supabaseAdmin } from "../lib/supabase.js";

const router = express.Router();

const QUESTIONS = [
  { id: "q1", type: "rating", text: "Comment évalueriez-vous la qualité des images générées ?" },
  { id: "q2", type: "rating", text: "L'interface est-elle facile à prendre en main ?" },
  { id: "q3", type: "rating", text: "La vitesse de génération vous convient-elle ?" },
  { id: "q4", type: "rating", text: "Les explications sur les crédits sont-elles claires ?" },
  { id: "q5", type: "rating", text: "Le processus de paiement est-il satisfaisant ?" },
  { id: "q6", type: "choice", text: "Quelle fonctionnalité utilisez-vous le plus ?", options: ["Tenues", "Voitures", "SnapRouge", "Je n'ai pas encore généré"] },
  { id: "q7", type: "choice", text: "Sur quel appareil utilisez-vous principalement Vysion ?", options: ["Ordinateur", "Mobile", "Tablette"] },
  { id: "q8", type: "choice", text: "Comment avez-vous découvert Vysion ?", options: ["Recherche", "Réseaux sociaux", "Bouche-à-oreille", "Publicité", "Autre"] },
  { id: "q9", type: "choice", text: "Recommanderiez-vous Vysion à quelqu'un ?", options: ["Oui, certainement", "Probablement", "Peut-être", "Non"] },
  { id: "q10", type: "choice", text: "Le plan tarifaire vous semble-t-il adapté ?", options: ["Très adapté", "Plutôt adapté", "Peu adapté", "Trop cher"] },
  { id: "q11", type: "rating", text: "La page Historique est-elle utile ?" },
  { id: "q12", type: "rating", text: "Les animations et le design sont-ils agréables ?" },
  { id: "q13", type: "rating", text: "Le support client répond-il à vos attentes ?" },
  { id: "q14", type: "open", text: "Qu'est-ce qui pourrait améliorer votre expérience sur Vysion ?" },
  { id: "q15", type: "open", text: "Quelle fonctionnalité aimeriez-vous voir ajoutée ?" },
];

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
 * GET /api/survey/questions
 * Returns the survey question list (no answers).
 */
router.get("/questions", (_req, res) => {
  res.json(QUESTIONS);
});

/**
 * GET /api/survey/status/:clerkUserId
 * Returns whether the user has already completed the survey.
 */
router.get("/status/:clerkUserId", async (req, res) => {
  const { clerkUserId } = req.params;
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("survey_completed")
    .eq("clerk_user_id", clerkUserId)
    .single();

  if (error) return res.status(404).json({ error: "User not found" });
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
  const { data: userRow, error: userError } = await supabaseAdmin
    .from("users")
    .select("survey_completed, credits")
    .eq("clerk_user_id", clerkUserId)
    .single();

  if (userError || !userRow) {
    return res.status(404).json({ error: "Utilisateur introuvable." });
  }

  if (userRow.survey_completed) {
    return res.status(403).json({ error: "Questionnaire déjà complété." });
  }

  // Validate open-ended answers.
  const openInvalid = {};
  for (const q of QUESTIONS) {
    if (q.type === "open") {
      const text = answers[q.id];
      if (!validateOpenAnswer(text)) {
        openInvalid[q.id] = "Merci de détailler un peu plus ta réponse";
      }
    }
  }

  if (Object.keys(openInvalid).length > 0) {
    return res.status(422).json({ invalid: openInvalid });
  }

  // Save the response.
  const { error: insertError } = await supabaseAdmin
    .from("survey_responses")
    .insert({ user_id: clerkUserId, answers });

  if (insertError) {
    console.error("survey insert error:", insertError);
    return res.status(500).json({ error: "Erreur lors de l'enregistrement du questionnaire." });
  }

  // Mark user as completed and credit 300 credits.
  const newCredits = (userRow.credits ?? 0) + 300;
  const { error: updateError } = await supabaseAdmin
    .from("users")
    .update({ survey_completed: true, credits: newCredits })
    .eq("clerk_user_id", clerkUserId);

  if (updateError) {
    console.error("survey credit update error:", updateError);
    return res.status(500).json({ error: "Erreur lors du crédit des points." });
  }

  res.json({ success: true, creditsEarned: 300, newCredits });
});

export default router;
