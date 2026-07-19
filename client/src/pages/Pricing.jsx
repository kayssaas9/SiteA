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
    priceEnvKey: "VITE_STRIPE_PRICE_BASIC",
    mode: "subscription",
    features: ["2 500 crédits / mois", "Génération tenue", "Remplacement voiture", "Support email"],
    highlight: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "24,99 €",
    period: "/mois",
    credits: 7500,
    priceEnvKey: "VITE_STRIPE_PRICE_PRO",
    mode: "subscription",
    features: ["7 500 crédits / mois", "Génération tenue HD", "Remplacement voiture HD", "Priorité file d'attente", "Support prioritaire"],
    highlight: true,
  },
  {
    id: "expert",
    name: "Expert",
    price: "49,99 €",
    period: "/mois",
    credits: 15000,
    priceEnvKey: "VITE_STRIPE_PRICE_EXPERT",
    mode: "subscription",
    features: ["15 000 crédits / mois", "Génération ultra HD", "Accès API", "Résultats exclusifs", "Support dédié 24/7"],
    highlight: false,
  },
];

const PACKS = [
  {
    id: "pack_4k",
    name: "Pack Starter",
    credits: 4000,
    price: "7,99 €",
    priceEnvKey: "VITE_STRIPE_PRICE_PACK_4K",
    mode: "payment",
  },
  {
    id: "pack_8k",
    name: "Pack Plus",
    credits: 8500,
    price: "14,99 €",
    priceEnvKey: "VITE_STRIPE_PRICE_PACK_8K",
    mode: "payment",
    popular: true,
  },
  {
    id: "pack_20k",
    name: "Pack Max",
    credits: 20000,
    price: "29,99 €",
    priceEnvKey: "VITE_STRIPE_PRICE_PACK_20K",
    mode: "payment",
  },
];

export default function Pricing() {
  const { user } = useUser();
  const [loading, setLoading] = useState(null);
  const [error, setError]     = useState(null);

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
      const res  = await fetch("/api/checkout", {
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
    <div className="pricing-page">
      <div className="pricing-hero">
        <div className="pricing-badge">✦ Tarifs</div>
        <h1 className="pricing-title">
          Choisissez votre <span className="gradient-text">formule</span>
        </h1>
        <p className="pricing-sub">
          Abonnement mensuel ou recharge ponctuelle — payez ce dont vous avez besoin.
        </p>
      </div>

      {/* ── Plans ── */}
      <section className="pricing-section">
        <h2 className="section-title">Abonnements mensuels</h2>
        <div className="plans-grid">
          {PLANS.map((plan) => (
            <div key={plan.id} className={`plan-card ${plan.highlight ? "highlight" : ""}`}>
              {plan.highlight && <div className="plan-badge">⚡ Le plus populaire</div>}
              <div className="plan-name">{plan.name}</div>
              <div className="plan-price">
                {plan.price}
                <span className="plan-period">{plan.period}</span>
              </div>
              <div className="plan-credits">{plan.credits.toLocaleString("fr-FR")} crédits / mois</div>
              <ul className="plan-features">
                {plan.features.map((f) => (
                  <li key={f}><span className="check">✓</span> {f}</li>
                ))}
              </ul>
              <button
                className={`plan-btn ${plan.highlight ? "plan-btn-primary" : "plan-btn-outline"}`}
                onClick={() => handleCheckout(plan.priceEnvKey, plan.mode, plan.id)}
                disabled={loading === plan.id}
              >
                {loading === plan.id ? "Redirection…" : "Choisir ce plan"}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── Credit packs ── */}
      <section className="pricing-section">
        <h2 className="section-title">Recharges ponctuelles</h2>
        <p className="section-sub">Crédits sans expiration, cumulables avec votre abonnement.</p>
        <div className="packs-grid">
          {PACKS.map((pack) => (
            <div key={pack.id} className={`pack-card ${pack.popular ? "highlight" : ""}`}>
              {pack.popular && <div className="pack-popular">⭐ Meilleure valeur</div>}
              <div className="pack-name">{pack.name}</div>
              <div className="pack-credits">{pack.credits.toLocaleString("fr-FR")} crédits</div>
              <div className="pack-price">{pack.price}</div>
              <button
                className="pack-btn"
                onClick={() => handleCheckout(pack.priceEnvKey, pack.mode, pack.id)}
                disabled={loading === pack.id}
              >
                {loading === pack.id ? "Redirection…" : "Acheter"}
              </button>
            </div>
          ))}
        </div>
      </section>

      {error && <div className="pricing-error">⚠️ {error}</div>}
    </div>
  );
}
