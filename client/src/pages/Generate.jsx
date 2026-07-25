import { SignedIn, SignedOut, useUser } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import ImageGenerator from "../components/ImageGenerator.jsx";
import { useUserData } from "../hooks/useUserData.js";
import { useSnapRougeAccess } from "../hooks/useSnapRougeAccess.js";
import "./Generate.css";

const ZapIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <rect x="5" y="11" width="14" height="10" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const SUBSCRIBER_PACKS = [
  { id: "pack_4k", name: "Pack Starter", credits: 4500, price: "15€", priceEnvKey: "VITE_STRIPE_PRICE_PACK_4K" },
  { id: "pack_10k", name: "Pack Standard", credits: 10000, price: "30€", priceEnvKey: "VITE_STRIPE_PRICE_PACK_10K", popular: true },
  { id: "pack_20k", name: "Pack Max", credits: 20000, price: "49€", priceEnvKey: "VITE_STRIPE_PRICE_PACK_20K" },
];

function PackCheckoutButton({ pack }) {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCheckout = async () => {
    if (!user) return;
    const priceId = import.meta.env[pack.priceEnvKey];
    if (!priceId) {
      setError("Prix non configuré.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, clerkUserId: user.id, mode: "payment" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de la création du paiement");
      window.location.href = data.url;
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <>
      <button className="recharge-btn" onClick={handleCheckout} disabled={loading}>
        {loading ? "Redirection…" : `Acheter ${pack.price}`}
      </button>
      {error && <p className="recharge-error">{error}</p>}
    </>
  );
}

export default function Generate() {
  const { credits, plan, loading } = useUserData();
  const { hasAccess: snapRougeAccess } = useSnapRougeAccess();
  const isSubscriber = ["basic", "pro", "expert"].includes(plan);

  return (
    <main className="generate-page">
      <div className="blob blob-1" />
      <div className="blob blob-2" />

      <div className="page generate-content">
        <div className="generate-credits-badge fade-up">
          <ZapIcon />
          <span className="generate-credits-value">{loading ? "—" : credits.toLocaleString("fr-FR")}</span>
          <span className="generate-credits-label">crédits</span>
        </div>

        <div className="generate-header fade-up delay-1">
          <h1 className="page-title">Transforme ta <span className="accent">voiture</span></h1>
          <p className="page-subtitle">
            Importe une photo, décris le résultat voulu et laisse l'IA générer le rendu.
          </p>
        </div>

        <SignedIn>
          <div className="generate-toolbox fade-up delay-2">
            <ImageGenerator />
          </div>

          <div className="generate-bottom fade-up delay-3">
            {!isSubscriber && !snapRougeAccess ? (
              <Link to="/snaprouge" className="snaprouge-mini-banner">
                <div className="snaprouge-mini-icon">
                  <LockIcon />
                </div>
                <div className="snaprouge-mini-content">
                  <div className="snaprouge-mini-title">SnapRouge</div>
                  <div className="snaprouge-mini-subtitle">Débloque la méthode exclusive</div>
                </div>
                <div className="snaprouge-mini-btn">9€</div>
              </Link>
            ) : isSubscriber ? (
              <div className="recharge-cards">
                {SUBSCRIBER_PACKS.map((pack, idx) => (
                  <div key={pack.id} className={`recharge-card delay-${idx + 1}`}>
                    {pack.popular && <div className="recharge-popular">POPULAIRE</div>}
                    <div className="recharge-credits">{pack.credits.toLocaleString("fr-FR")} crédits</div>
                    <div className="recharge-price">{pack.price}</div>
                    <PackCheckoutButton pack={pack} />
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </SignedIn>

        <SignedOut>
          <div className="generate-auth fade-up delay-2">
            <p>Connecte-toi pour générer des images.</p>
            <Link to="/sign-in" className="btn btn-primary">
              Se connecter
            </Link>
          </div>
        </SignedOut>
      </div>
    </main>
  );
}
