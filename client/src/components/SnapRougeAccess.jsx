import { useState } from "react";
import { Link } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useSnapRougeAccess } from "../hooks/useSnapRougeAccess.js";
import "./SnapRougeAccess.css";
import { navigateToSafeUrl } from "../lib/safeUrl.js";

const SNAP_ROUGE_PRICE_KEY = "VITE_STRIPE_PRICE_SNAPROUGE";

const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="11" width="14" height="10" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const SparklesIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z" />
    <path d="M19 13l1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1 1-2.5z" opacity="0.8" />
  </svg>
);

const ZapIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const DiamondIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3h12l4 7-10 11L2 10l4-7z" />
    <path d="M12 22V10" />
    <path d="M12 10 2 10" />
    <path d="m12 10 10 0" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

const CHECKLIST = [
  "Système exclusif SnapRouge sans média chargé",
  "Méthode 100% indétectable",
  "Accès à vie",
];

const PLANS = [
  {
    id: "pro",
    name: "Pro",
    price: "19,99 €",
    credits: 7500,
    icon: <ZapIcon />,
  },
  {
    id: "expert",
    name: "Expert",
    price: "39,99 €",
    credits: 18000,
    icon: <DiamondIcon />,
  },
];

export default function SnapRougeAccess() {
  const { user } = useUser();
  const { refetch } = useSnapRougeAccess();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleUnlock = async () => {
    if (!user) return;

    const priceId = import.meta.env[SNAP_ROUGE_PRICE_KEY];
    if (!priceId) {
      setError("Configuration de paiement SnapRouge manquante.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId,
          clerkUserId: user.id,
          mode: "payment",
           generationId: window.localStorage.getItem("astraPendingGenerationId")
             || window.sessionStorage.getItem("astraPendingGenerationId")
             || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de la création du paiement");
      if (!data.url) throw new Error("URL de paiement manquante");
      navigateToSafeUrl(data.url);
    } catch (err) {
      console.error("SnapRouge unlock error:", err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleRefreshAccess = () => {
    refetch?.();
  };

  return (
    <main className="snaprouge-access-page">
      <div className="blob blob-1" style={{ background: "var(--snaprouge)" }} />
      <div className="blob blob-2" style={{ background: "var(--snaprouge)" }} />

      <div className="snaprouge-access-content">
        <div className="snaprouge-access-hero fade-up">
          <div className="snaprouge-access-icon">
            <LockIcon />
          </div>
          <h1 className="snaprouge-access-title">SnapRouge</h1>
          <p className="snaprouge-access-subtitle">
            Découvre comment envoyer des snaps rouges indétectables avec les photos générées par Astra.
          </p>
        </div>

        <div className="snaprouge-access-card fade-up delay-1">
          <div className="snaprouge-access-card-header">
            <span className="snaprouge-access-lifetime">Accès à vie</span>
            <span className="snaprouge-access-price">9€</span>
          </div>

          <ul className="snaprouge-access-checklist">
            {CHECKLIST.map((item) => (
              <li key={item}>
                <span className="snaprouge-access-check">
                  <CheckIcon />
                </span>
                {item}
              </li>
            ))}
          </ul>

          <button
            className="snaprouge-access-btn"
            onClick={handleUnlock}
            disabled={loading}
          >
            {loading ? "Redirection…" : "Débloquer pour 9€"}
          </button>

          {error && <p className="snaprouge-access-error">⚠️ {error}</p>}

          <p className="snaprouge-access-secondary">
            J'ai déjà payé —{" "}
            <button className="snaprouge-access-link" onClick={handleRefreshAccess}>
              activer mon accès
            </button>
          </p>
        </div>

        <div className="snaprouge-access-plans fade-up delay-2">
          <div className="snaprouge-access-plans-blur" />
          <h2 className="snaprouge-access-plans-title">
            <SparklesIcon />
            Déjà inclus avec un abonnement
          </h2>

          <div className="snaprouge-access-plans-list">
            {PLANS.map((plan) => (
              <div key={plan.id} className="snaprouge-access-plan">
                <div className="snaprouge-access-plan-icon">{plan.icon}</div>
                <div className="snaprouge-access-plan-info">
                  <div className="snaprouge-access-plan-name">
                    {plan.name} <span className="snaprouge-access-plan-price">{plan.price}</span>
                  </div>
                  <div className="snaprouge-access-plan-credits">
                    SnapRouge inclus + {plan.id === "expert" ? "Illimités" : `${plan.credits.toLocaleString("fr-FR")} crédits/mois`}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Link to="/pricing" className="snaprouge-access-plans-btn">
            Voir les abonnements
            <ArrowRightIcon />
          </Link>
        </div>
      </div>
    </main>
  );
}
