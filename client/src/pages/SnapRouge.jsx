import { useUserData } from "../hooks/useUserData.js";
import "./SnapRouge.css";

const STEPS = [
  {
    title: "Ouvre l’appareil photo",
    description: "Ouvre Snapchat et rends-toi sur l’écran pour prendre une photo.",
  },
  {
    title: "Ouvre les effets",
    description: "En bas à droite, appuie sur le smiley avec l’étoile.",
  },
  {
    title: "Cherche un effet",
    description: "En haut à droite, appuie sur le bouton en forme de loupe.",
  },
  {
    title: "Recherche « photo »",
    description: "Écris « photo » dans la barre de recherche, puis sélectionne le logo multicolore sur fond blanc.",
  },
  {
    title: "Choisis ton image",
    description: "Sélectionne l’image que tu veux envoyer.",
  },
  {
    title: "Prends la photo",
    description: "Appuie sur le bouton pour prendre la photo avec l’image choisie.",
  },
  {
    title: "Choisis tes destinataires",
    description: "Sélectionne la ou les personnes à qui tu veux envoyer la photo.",
  },
  {
    title: "Envoie la photo",
    description: "Appuie sur le bouton d’envoi pour partager ta photo.",
  },
  {
    title: "Admire leur réaction",
    description: "Regarde la réaction de tes potes : ils vont être choqués !",
  },
];

export default function SnapRouge() {
  const { plan } = useUserData();
  const isSubscriber = plan === "pro" || plan === "expert";

  return (
    <main className="snaprouge-page">
      <div className="blob blob-1" style={{ background: "var(--snaprouge)" }} />
      <div className="blob blob-2" style={{ background: "var(--snaprouge)" }} />

      <div className="page snaprouge-content">
        <div className="snaprouge-hero-v2 fade-up">
          <div className="snaprouge-badge-v2">Méthode exclusive</div>
          <h1 className="page-title">SnapRouge — La méthode en 9 étapes</h1>
          <p className="page-subtitle">
            {isSubscriber
              ? "Incluse avec votre abonnement Pro / Expert."
              : "Du concept au rendu final, en 9 étapes clés."}
          </p>
        </div>

        <div className="steps-grid">
          {STEPS.map((step, idx) => (
            <div key={step.title} className={`step-card fade-up delay-${Math.min(idx + 1, 4)}`}>
              <div className="step-card-content">
                <span className="step-number">Étape {idx + 1}</span>
                <h2 className="step-title">{step.title}</h2>
                <p className="step-description">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
