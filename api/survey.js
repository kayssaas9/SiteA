import { supabaseAdmin } from "../server/lib/supabase.js";

const SUBSCRIBER_PLANS = new Set(["basic", "pro", "expert"]);
const MAX_EXPERT_CREDITS = 20000;

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

function getBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return null;
    }
  }
  return req.body;
}

function validateOpenAnswer(text) {
  if (!text || text.length < 20) return false;
  if (/(.)\1{4,}/.test(text)) return false;
  const words = text
    .toLowerCase()
    .replace(/[^a-zàâäéèêëïîôùûüç0-9\s]/g, "")
    .split(/\s+/)
    .filter((word) => word.length >= 3);
  return new Set(words).size >= 3;
}

function getQueryValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

async function handleStatus(clerkUserId, res) {
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

async function handleQuestions(clerkUserId, res) {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("plan, survey_completed")
    .eq("clerk_user_id", clerkUserId)
    .single();
  if (error || !data) return res.status(404).json({ error: "Utilisateur introuvable." });
  if (!SUBSCRIBER_PLANS.has(data.plan)) {
    return res.status(403).json({ error: "Le questionnaire est réservé aux abonnés." });
  }
  return res.status(200).json(QUESTIONS);
}

async function handleSubmit(req, res) {
  const body = getBody(req);
  if (!body) return res.status(400).json({ error: "Invalid JSON body" });

  const { clerkUserId, answers } = body;
  if (!clerkUserId) return res.status(400).json({ error: "Identifiant utilisateur manquant." });
  if (!answers || typeof answers !== "object") {
    return res.status(400).json({ error: "Réponses manquantes." });
  }

  const { data: userRow, error: userError } = await supabaseAdmin
    .from("users")
    .select("plan, survey_completed, credits")
    .eq("clerk_user_id", clerkUserId)
    .single();
  if (userError || !userRow) return res.status(404).json({ error: "Utilisateur introuvable." });
  if (!SUBSCRIBER_PLANS.has(userRow.plan)) {
    return res.status(403).json({ error: "Le questionnaire est réservé aux abonnés." });
  }
  if (userRow.survey_completed) {
    return res.status(403).json({ error: "Questionnaire déjà complété." });
  }

  const invalid = {};
  for (const question of QUESTIONS) {
    if (!validateOpenAnswer(answers[question.id])) {
      invalid[question.id] = "Merci de détailler un peu plus ta réponse";
    }
  }
  if (Object.keys(invalid).length > 0) return res.status(422).json({ invalid });

  const { error: insertError } = await supabaseAdmin
    .from("survey_responses")
    .insert({ user_id: clerkUserId, answers });
  if (insertError) {
    console.error("survey insert error:", insertError);
    return res.status(500).json({ error: "Erreur lors de l'enregistrement du questionnaire." });
  }

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

export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const route = getQueryValue(req.query?.route);

  if (route === "submit") {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method not allowed" });
    }
    return handleSubmit(req, res);
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const clerkUserId = getQueryValue(req.query?.clerkUserId);
  if (!clerkUserId) return res.status(400).json({ error: "clerkUserId is required" });
  if (route === "status") return handleStatus(clerkUserId, res);
  if (route === "questions") return handleQuestions(clerkUserId, res);
  return res.status(404).json({ error: "Not found" });
}