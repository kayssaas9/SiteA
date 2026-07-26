import { useUser } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useUserData } from "../hooks/useUserData.js";
import { useSnapRougeAccess } from "../hooks/useSnapRougeAccess.js";
import "./Pricing.css";

const PLANS = [
  {
    id: "basic",
    name: "Basique",
    originalPrice: "11,99 €",
    price: "9,99 €",
    period: "/mois",
    monthlyBilling: "Facturé mensuellement",
    annualBilling: "Facturé 99€/an",
    credits: 2500,
    monthlyPriceEnvKey: "VITE_STRIPE_PRICE_BASIQUE",
    annualPriceEnvKey: "VITE_STRIPE_PRICE_BASIQUE_ANNUEL",
    features: ["2 500 crédits / mois", "Génération tenue", "Remplacement voiture", "Support email"],
    previous: null,
  },
  {
    id: "pro",
    name: "Pro",
    originalPrice: "24,99 €",
    price: "19,99 €",
    period: "/mois",
    monthlyBilling: "Facturé mensuellement",
    annualBilling: "Facturé 199€/an",
    credits: 7500,
    monthlyPriceEnvKey: "VITE_STRIPE_PRICE_PRO",
    annualPriceEnvKey: "VITE_STRIPE_PRICE_PRO_ANNUEL",
    features: ["7 500 crédits / mois", "Génération tenue HD", "Remplacement voiture HD", "Priorité file d'attente", "Support prioritaire"],
    previous: "Basique",
    highlight: true,
    badge: "Le plus populaire",
  },
  {
    id: "expert",
    name: "Expert",
    originalPrice: "49,99 €",
    price: "39,99 €",
    period: "/mois",
    monthlyBilling: "Facturé mensuellement",
    annualBilling: "Facturé 399€/an",
    credits: 18000,
    monthlyPriceEnvKey: "VITE_STRIPE_PRICE_EXPERT",
    annualPriceEnvKey: "VITE_STRIPE_PRICE_EXPERT_ANNUEL",
    features: ["18 000 crédits / mois", "Génération ultra HD", "Accès SnapRouge inclus", "Résultats exclusifs", "Support dédié 24/7"],
    previous: "Pro",
    badge: "Exclusif",
  },
];

const ShieldIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const SUBSCRIBER_PACKS = [
  { id: "pack_4k", name: "Pack Starter", credits: 4500, price: "15,00 €", priceEnvKey: "VITE_STRIPE_PRICE_PACK_4K" },
  { id: "pack_10k", name: "Pack Standard", credits: 10000, price: "30,00 €", priceEnvKey: "VITE_STRIPE_PRICE_PACK_10K" },
  { id: "pack_20k", name: "Pack Max", credits: 20000, price: "49,00 €", priceEnvKey: "VITE_STRIPE_PRICE_PACK_20K" },
];

const NON_SUBSCRIBER_PACKS = [
  { id: "pack_800", name: "Pack Découverte", credits: 800, price: "9,99 €", priceEnvKey: "VITE_STRIPE_PRICE_PACK_800" },
  { id: "pack_2k", name: "Pack Starter", credits: 2000, price: "19,99 €", priceEnvKey: "VITE_STRIPE_PRICE_PACK_2K" },
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
  const { plan: userPlan } = useUserData();
  const { hasAccess: snapRougeAccess } = useSnapRougeAccess();
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);
  const [isAnnual, setIsAnnual] = useState(true);

  const hasSubscription = ["basic", "pro", "expert"].includes(userPlan);
  const activePacks = hasSubscription ? SUBSCRIBER_PACKS : NON_SUBSCRIBER_PACKS;

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
        <div className="pricing-header fade-up">
          <h1 className="page-title pricing-title">Choisissez votre <span className="accent">formule</span></h1>
          <p className="page-subtitle">Abonnement résiliable à tout moment dans les paramètres.</p>
        </div>

        <div className="billing-toggle fade-up">
          <button
            className={!isAnnual ? "active" : ""}
            onClick={() => setIsAnnual(false)}
            type="button"
          >
            Mensuel
          </button>
          <button
            className={isAnnual ? "active" : ""}
            onClick={() => setIsAnnual(true)}
            type="button"
          >
            Annuel
          </button>
        </div>

        <div className="plans-grid">
          {PLANS.map((plan, idx) => {
            const isCurrentPlan = plan.id === userPlan;
            return (
              <div
                key={plan.id}
                className={`plan-card-v2 card ${plan.highlight ? "highlight" : ""} ${isCurrentPlan ? "current" : ""} fade-up delay-${idx + 1}`}
              >
                {plan.badge && (
                  <div className={`plan-badge-v2 ${plan.badge === "Exclusif" ? "exclusive" : ""}`}>
                    {plan.badge}
                  </div>
                )}
                {isCurrentPlan && <div className="current-plan-badge">Abonnement en cours</div>}
                <div className="plan-name-v2">{plan.name}</div>
                <div className="plan-price-block">
                  <div className="plan-original-price">{plan.originalPrice}</div>
                  <div className="plan-price-v2">
                    {plan.price}<span className="plan-period-v2">{plan.period}</span>
                  </div>
                  <div className="plan-billing">{isAnnual ? plan.annualBilling : plan.monthlyBilling}</div>
                </div>
                <div className="plan-guarantee">
                  <ShieldIcon /> Satisfait ou remboursé
                </div>
                <div className="plan-credits-v2">{plan.credits.toLocaleString("fr-FR")} crédits / mois</div>
                {plan.previous && <div className="plan-includes">Tout {plan.previous}, plus :</div>}
                <ul className="plan-features-v2">
                  {plan.features.map((f) => (
                    <li key={f}><span className="check">✓</span> {f}</li>
                  ))}
                </ul>
                {isCurrentPlan ? (
                  <button className="btn plan-cta plan-cta-current" disabled type="button">
                    Abonnement en cours
                  </button>
                ) : (
                  <button
                    className={`btn ${plan.highlight ? "btn-primary" : "btn-outline"} plan-cta`}
                    onClick={() => handleCheckout(
                      isAnnual ? plan.annualPriceEnvKey : plan.monthlyPriceEnvKey,
                      "subscription",
                      plan.id
                    )}
                    disabled={loading === plan.id}
                    type="button"
                  >
                    {loading === plan.id ? "Redirection…" : "Choisir ce plan"}
                  </button>
                )}
              </div>
            );
          })}
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
              <div className={`snaprouge-pricing-price ${snapRougeAccess ? "unlocked" : ""}`}>
                {snapRougeAccess ? "Inclus avec Pro/Expert" : SNAP_ROUGE.price}
              </div>
              {snapRougeAccess ? (
                <Link to="/snaprouge" className="btn btn-snaprouge">
                  Accéder
                </Link>
              ) : (
                <button
                  className="btn btn-snaprouge"
                  onClick={() => handleCheckout(SNAP_ROUGE.priceEnvKey, "payment", SNAP_ROUGE.id)}
                  disabled={loading === SNAP_ROUGE.id}
                >
                  {loading === SNAP_ROUGE.id ? "Redirection…" : "Débloquer"}
                </button>
              )}
            </div>
          </div>

          <div className="packs-section">
            <h2 className="packs-title">
              {hasSubscription ? "Recharges abonnés" : "Recharges sans abonnement"}
            </h2>
            <p className="packs-subtitle">
              {hasSubscription
                ? "Crédits sans expiration, réservés aux abonnés."
                : "Crédits sans expiration, sans abonnement."}
            </p>
            <div className="packs-grid-v2">
              {activePacks.map((pack) => (
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
