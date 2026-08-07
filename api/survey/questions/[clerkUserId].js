import { supabaseAdmin } from "../../../server/lib/supabase.js";

const SUBSCRIBER_PLANS = new Set(["basic", "pro", "expert"]);

const QUESTIONS = [
  { id: "q1",  text: "Comment évalueriez-vous la qualité des images générées ?" },
  { id: "q2",  text: "L'interface est-elle facile à prendre en main ? Expliquez pourquoi." },
  { id: "q3",  text: "La vitesse de génération vous convient-elle ?" },
  { id: "q4",  text: "Les explications sur les crédits sont-elles claires ?" },
  { id: "q5",  text: "Le processus de paiement est-il satisfaisant ?" },
  { id: "q6",  text: "Quelle fonctionnalité utilisez-vous le plus et pourquoi ?" },
  { id: "q7",  text: "Sur quel appareil utilisez-vous principalement Astra ?" },
  { id: "q8",  text: "Comment avez-vous découvert Astra ?" },
  { id: "q9",  text: "Recommanderiez-vous Astra à quelqu'un ? Pourquoi ?" },
  { id: "q10", text: "Le plan tarifaire vous semble-t-il adapté ?" },
  { id: "q11", text: "La page Historique est-elle utile ? Que pourrait-on améliorer ?" },
  { id: "q12", text: "Les animations et le design sont-ils agréables ?" },
  { id: "q13", text: "Le support client répond-il à vos attentes ?" },
  { id: "q14", text: "Qu'est-ce qui pourrait améliorer votre expérience sur Astra ?" },
  { id: "q15", text: "Quelle fonctionnalité aimeriez-vous voir ajoutée ?" },
];

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

  if (error || !data) return res.status(404).json({ error: "Utilisateur introuvable." });

  if (!SUBSCRIBER_PLANS.has(data.plan)) {
    return res.status(403).json({ error: "Le questionnaire est réservé aux abonnés." });
  }

  return res.status(200).json(QUESTIONS);
}
