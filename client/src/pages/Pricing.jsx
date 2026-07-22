import { useUser } from "@clerk/clerk-react";
import { useState } from "react";
import "./Pricing.css";

const PLANS = [
  {
    id: "basic",
    name: "Basique",
    price: "9,99 €",
    period: "/mois",
    credits: 2500,
    priceEnvKey: "VITE_STRIPE_PRICE_BASIQUE",
    features: ["2 500 crédits / mois", "Génération tenue", "Remplacement voiture", "Support email"],
    previous: null,
  },
  {
    id: "pro",
    name: "Pro",
    price: "19,99 €",
    period: "/mois",
    credits: 7500,
    priceEnvKey: "VITE_STRIPE_PRICE_PRO",
    features: ["7 500 crédits / mois", "Génération tenue HD", "Remplacement voiture HD", "Priorité file d'attente", "Support prioritaire"],
    previous: "Basique",
    highlight: true,
    badge: "Le plus populaire",
  },
  {
    id: "expert",
    name: "Expert",
    price: "39,99 €",
    period: "/mois",
    credits: 15000,
    priceEnvKey: "VITE_STRIPE_PRICE_EXPERT",
    features: ["15 000 crédits / mois", "Génération ultra HD", "Accès SnapRouge inclus", "Résultats exclusifs", "Support dédié 24/7"],
    previous: "Pro",
  },
];

const PACKS = [
  { id: "pack_4k", name: "Pack Starter", credits: 4000, price: "11,99 €", priceEnvKey: "VITE_STRIPE_PRICE_PACK_4K" },
  { id: "pack_8k", name: "Pack Plus", credits: 8500, price: "24,99 €", priceEnvKey: "VITE_STRIPE_PRICE_PACK_8K" },
  { id: "pack_20k", name: "Pack Max", credits: 20000, price: "49,99 €", priceEnvKey: "VITE_STRIPE_PRICE_PACK_20K" },
];

const SNAP_ROUGE = {
  id: "snaprouge",
  name: "Accès SnapRouge",
  price: "9,00 €",
  priceEnvKey: "VITE_STRIPE_PRICE_SNAPROUGE",
  description: "Méthode exclusive en 9 étapes. Débloqué gratuitement avec Pro ou Expert.",
};

export default function Pricing() {
  const { user } = useUser();
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);
  const showUnlockBanner = new URLSearchParams(window.location.search).get("unlock") === "snaprouge";

  const handleCheckout = async (priceEnvKey, mode, itemId) => {
    if (!user) {
      setError("Connectez-vous d'abord pour continuer.");
      return;
    }

    const priceId = import.meta.env[priceEnvKey];
    if (!priceId) {
      setError(`Price ID manquant pour ${priceEnvKey}. Configurez-le dans les Secrets Replit.`);
      return;
    }

    setLoading(itemId);
    setError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, clerkUserId: user.id, mode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de la création du paiement");
      window.location.href = data.url;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <main className="pricing-page">
      <div className="blob blob-1" />
      <div className="blob blob-2" />

      <div className="page pricing-content">
        {showUnlockBanner && (
          <div className="unlock-banner fade-up">
            <span className="unlock-icon">🔒</span>
            <div>
              <strong>Accès SnapRouge requis</strong>
              <p>Débloquez SnapRouge ci-dessous ou choisissez un abonnement Pro/Expert.</p>
            </div>
          </div>
        )}

        <div className="pricing-header fade-up">
          <div className="badge">Tarifs</div>
          <h1 className="page-title">Choisissez votre <span className="accent">formule</span></h1>
          <p className="page-subtitle">Abonnement mensuel simple, avec recharges ponctuelles à la carte.</p>
        </div>

        <div className="plans-grid">
          {PLANS.map((plan, idx) => (
            <div
              key={plan.id}
              className={`plan-card-v2 card ${plan.highlight ? "highlight" : ""} fade-up delay-${idx + 1}`}
            >
              {plan.badge && <div className="plan-badge-v2">{plan.badge}</div>}
              <div className="plan-name-v2">{plan.name}</div>
              <div className="plan-price-v2">
                {plan.price}<span className="plan-period-v2">{plan.period}</span>
              </div>
              <div className="plan-credits-v2">{plan.credits.toLocaleString("fr-FR")} crédits / mois</div>
              {plan.previous && <div className="plan-includes">Tout {plan.previous}, plus :</div>}
              <ul className="plan-features-v2">
                {plan.features.map((f) => (
                  <li key={f}><span className="check">✓</span> {f}</li>
                ))}
              </ul>
              <button
                className={`btn ${plan.highlight ? "btn-primary" : "btn-outline"} plan-cta`}
                onClick={() => handleCheckout(plan.priceEnvKey, "subscription", plan.id)}
                disabled={loading === plan.id}
              >
                {loading === plan.id ? "Redirection…" : "Choisir ce plan"}
              </button>
            </div>
          ))}
        </div>

        <div className="pricing-extra fade-up delay-4">
          <div className="snaprouge-pricing card">
            <div className="snaprouge-pricing-content">
              <div className="snaprouge-pricing-header">
                <span className="snaprouge-dot" />
                <div className="snaprouge-pricing-name">{SNAP_ROUGE.name}</div>
              </div>
              <p className="snaprouge-pricing-desc">{SNAP_ROUGE.description}</p>
            </div>
            <div className="snaprouge-pricing-action">
              <div className="snaprouge-pricing-price">{SNAP_ROUGE.price}</div>
              <button
                className="btn btn-snaprouge"
                onClick={() => handleCheckout(SNAP_ROUGE.priceEnvKey, "payment", SNAP_ROUGE.id)}
                disabled={loading === SNAP_ROUGE.id}
              >
                {loading === SNAP_ROUGE.id ? "Redirection…" : "Débloquer"}
              </button>
            </div>
          </div>

          <div className="packs-section">
            <h2 className="packs-title">Recharges ponctuelles</h2>
            <p className="packs-subtitle">Sans abonnement, crédits sans expiration.</p>
            <div className="packs-grid-v2">
              {PACKS.map((pack) => (
                <div key={pack.id} className="pack-card-v2 card">
                  <div className="pack-name-v2">{pack.name}</div>
                  <div className="pack-credits-v2">{pack.credits.toLocaleString("fr-FR")} crédits</div>
                  <div className="pack-price-v2">{pack.price}</div>
                  <button
                    className="btn btn-outline pack-cta"
                    onClick={() => handleCheckout(pack.priceEnvKey, "payment", pack.id)}
                    disabled={loading === pack.id}
                  >
                    {loading === pack.id ? "Redirection…" : "Acheter"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {error && <div className="pricing-error fade-up">⚠️ {error}</div>}
      </div>
    </main>
  );
}
