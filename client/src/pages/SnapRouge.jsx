import { useUserData } from "../hooks/useUserData.js";
import "./SnapRouge.css";

const STEPS = Array.from({ length: 9 }, (_, i) => i + 1);

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
            <div key={step} className={`step-card fade-up delay-${Math.min(idx + 1, 4)}`}>
              <span className="step-number">Étape {step}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
