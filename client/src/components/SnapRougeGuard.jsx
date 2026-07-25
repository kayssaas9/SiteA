import { Navigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useEffect, useRef, useState } from "react";
import { useSnapRougeAccess } from "../hooks/useSnapRougeAccess.js";
import "./SnapRougeGuard.css";

const SNAP_ROUGE_PRICE_KEY = "VITE_STRIPE_PRICE_SNAPROUGE";

/**
 * Wraps a route that requires SnapRouge access.
 * Access is granted if the user has an active Pro/Expert plan OR if they
 * bought the SnapRouge one-time unlock.
 *
 * If a logged-in user has no access, they are sent directly to the Stripe
 * checkout for the SnapRouge one-time product. Anonymous users are sent to
 * the pricing page with the unlock banner.
 */
export default function SnapRougeGuard({ children }) {
  const { user } = useUser();
  const { hasAccess, loading } = useSnapRougeAccess();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);
  const [ready, setReady] = useState(false);
  const initiated = useRef(false);

  // Wait for the first access check to complete before deciding to redirect.
  // This prevents initiating a checkout on the very first render while user data
  // is still loading (useSnapRougeAccess starts with hasAccess=false).
  useEffect(() => {
    if (!loading) setReady(true);
  }, [loading]);

  useEffect(() => {
    if (!ready || loading || hasAccess || !user || initiated.current) return;
    initiated.current = true;
    setCheckoutLoading(true);

    const priceId = import.meta.env[SNAP_ROUGE_PRICE_KEY];
    if (!priceId) {
      setCheckoutError("Configuration de paiement SnapRouge manquante.");
      setCheckoutLoading(false);
      return;
    }

    fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        priceId,
        clerkUserId: user.id,
        mode: "payment",
      }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur lors de la création du paiement");
        if (!data.url) throw new Error("URL de paiement manquante");
        window.location.href = data.url;
      })
      .catch((err) => {
        console.error("SnapRouge checkout error:", err);
        setCheckoutError(err.message);
        setCheckoutLoading(false);
      });
  }, [ready, loading, hasAccess, user]);

  if (loading || checkoutLoading) {
    return (
      <div className="snaprouge-loading">
        <div className="spinner" />
        <p>
          {checkoutLoading
            ? "Redirection vers le paiement SnapRouge…"
            : "Vérification de l'accès SnapRouge…"}
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/pricing?unlock=snaprouge" replace />;
  }

  if (checkoutError) {
    return (
      <div className="snaprouge-loading">
        <p>⚠️ {checkoutError}</p>
      </div>
    );
  }

  if (!hasAccess) {
    // Checkout was initiated in the effect above; keep showing the redirect state
    // in case the window.location change hasn't happened yet.
    return (
      <div className="snaprouge-loading">
        <div className="spinner" />
        <p>Redirection vers le paiement SnapRouge…</p>
      </div>
    );
  }

  return children;
}
