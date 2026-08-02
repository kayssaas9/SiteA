import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import ImageUpload from "./ImageUpload.jsx";
import ResultDisplay from "./ResultDisplay.jsx";
import { useUserData } from "../hooks/useUserData.js";
import "./ImageGenerator.css";

const GENERATION_COST = 100;

const PRICING_OPTIONS = [
  { name: "Basique", price: "9,99 €", details: "2 500 crédits / mois" },
  { name: "Pro", price: "19,99 €", details: "7 500 crédits / mois" },
  { name: "Expert", price: "39,99 €", details: "Crédits illimités" },
];

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const MinusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <path d="M5 12h14" />
  </svg>
);

export default function ImageGenerator() {
  const { user } = useUser();
  const { plan, credits, loading: userDataLoading, refetch: refetchUserData } = useUserData();
  const [mainPhoto, setMainPhoto] = useState(null);
  const [refs, setRefs] = useState({ ref1: null, ref2: null });
  const [showRefs, setShowRefs] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pricingPreview, setPricingPreview] = useState(false);
  const [error, setError] = useState(null);
  const [showPricingModal, setShowPricingModal] = useState(false);

  const unlockedCount = plan === "expert" ? 2 : plan === "pro" ? 1 : 0;
  const hasNoGenerationAccess =
    !userDataLoading && credits <= 0;

  const startPricingPreview = () => {
    setShowPricingModal(false);
    setPricingPreview(true);
    setLoading(true);
  };

  useEffect(() => {
    if (!pricingPreview) return undefined;

    const timer = window.setTimeout(() => {
      setLoading(false);
      setPricingPreview(false);
      setShowPricingModal(true);
    }, 2000);

    return () => window.clearTimeout(timer);
  }, [pricingPreview]);

  const handleRefChange = (slot, value) => {
    setRefs((r) => ({ ...r, [slot]: value }));
  };

  const loadGeneration = async (generationId) => {
    if (!generationId || !user?.id) return null;

    const res = await fetch(
      `/api/generations/${encodeURIComponent(generationId)}?clerkUserId=${encodeURIComponent(user.id)}&fresh=${Date.now()}`,
      { cache: "no-store", headers: { "Cache-Control": "no-cache" } },
    );
    if (!res.ok) return null;

    const data = await res.json();
    if (data.imageUrl) {
      setResult({
        imageUrl: data.imageUrl,
        teaser: !data.unlocked,
        generationId: data.id,
      });
    }
    return data;
  };

  // Stripe sends the user away from the generator. Keep the generation id in
  // session storage so the exact teaser can become sharp after payment.
  useEffect(() => {
    const generationId = window.sessionStorage.getItem("astraPendingGenerationId");
    if (!generationId || !user?.id) return undefined;

    let cancelled = false;
    let attempts = 0;
    let timer;

    const refresh = async () => {
      if (cancelled) return;
      const data = await loadGeneration(generationId);
      if (data?.unlocked) {
        window.sessionStorage.removeItem("astraPendingGenerationId");
        await refetchUserData();
        return;
      }

      // The Stripe webhook may arrive just after the redirect.
      attempts += 1;
      if (attempts < 40) timer = window.setTimeout(refresh, 1500);
    };

    refresh();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [refetchUserData, user?.id]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setError(null);
    setResult(null);

    if (hasNoGenerationAccess) {
      startPricingPreview();
      return;
    }

    setLoading(true);
    let pricingPreviewStarted = false;

    try {
      const form = new FormData();
      form.append("mode", "car");
      form.append("prompt", prompt);
      form.append("clerk_user_id", user?.id || "");
      if (mainPhoto?.file) form.append("image", mainPhoto.file);
      if (unlockedCount >= 1 && refs.ref1?.file) form.append("reference_1", refs.ref1.file);
      if (unlockedCount >= 2 && refs.ref2?.file) form.append("reference_2", refs.ref2.file);

      const res = await fetch("/api/generate", { method: "POST", body: form });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 402 && data.code === "NO_CREDITS") {
          pricingPreviewStarted = true;
          startPricingPreview();
          return;
        }
        throw new Error(data.error || "La génération a échoué");
      }
      setResult({
        imageUrl: data.imageUrl,
        teaser: Boolean(data.teaser),
        generationId: data.generationId,
      });
      window.dispatchEvent(new Event("astra-user-data-changed"));
      if (data.teaser && data.generationId) {
        window.sessionStorage.setItem("astraPendingGenerationId", data.generationId);
      } else {
        window.sessionStorage.removeItem("astraPendingGenerationId");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      if (!pricingPreviewStarted) setLoading(false);
    }
  };

  const ReferenceSlot = ({ slot, index, unlocked }) => {
    const value = refs[slot];
    const lockMessage =
      plan === "pro" && index === 2
        ? "Débloqué avec Expert"
        : "Débloqué avec Pro ou Expert";

    return (
      <div className={`ref-slot ${!unlocked ? "locked" : ""} ${value ? "has-image" : ""}`}>
        {!unlocked ? (
          <div className="ref-lock">
            <div className="ref-lock-icon">🔒</div>
            <div className="ref-lock-text">{lockMessage}</div>
          </div>
        ) : (
          <ImageUpload
            variant="reference"
            label={`Référence ${index}`}
            hint="PNG, JPG · Jusqu'à 10 Mo"
            value={value}
            onChange={(v) => handleRefChange(slot, v)}
          />
        )}
      </div>
    );
  };

  return (
    <div className="image-generator-v2">
      <div className="gen-section main-upload-section">
        <ImageUpload
          variant="main"
          value={mainPhoto}
          onChange={setMainPhoto}
        />
      </div>

      <div className="gen-section refs-section">
        <button
          className="refs-toggle"
          onClick={() => setShowRefs((s) => !s)}
          type="button"
        >
          <span>{showRefs ? <MinusIcon /> : <PlusIcon />}</span>
          Ajouter des références
          <span className="refs-badge">OPTIONNEL</span>
        </button>

        {showRefs && (
          <div className="refs-panel fade-in">
            <p className="refs-hint">Ajoute jusqu'à 2 images supplémentaires pour guider la génération.</p>
            <div className="refs-grid">
              <ReferenceSlot slot="ref1" index={1} unlocked={unlockedCount >= 1} />
              <ReferenceSlot slot="ref2" index={2} unlocked={unlockedCount >= 2} />
            </div>
          </div>
        )}
      </div>

      <div className="gen-section">
        <textarea
          className="gen-textarea"
          placeholder="Décris précisément le résultat (ex : remplace par une GT3RS noire, jantes forgées)..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
        />
      </div>

      <div className="gen-submit">
        <button
          className="gen-btn"
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
        >
          {loading ? "Génération…" : `Générer — ${GENERATION_COST} crédits`}
        </button>
      </div>

      <ResultDisplay
        imageUrl={result?.imageUrl}
        teaser={result?.teaser}
        loading={loading}
        loadingMessage="Génération en cours…"
        loadingSubtext="Cela prend généralement 10 à 30 secondes"
        error={error}
      />

      {showPricingModal && !pricingPreview && (
        <div
          className="pricing-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowPricingModal(false);
          }}
        >
          <section
            className="pricing-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pricing-modal-title"
          >
            <button
              type="button"
              className="pricing-modal-close"
              aria-label="Fermer"
              onClick={() => setShowPricingModal(false)}
            >
              ×
            </button>
            <div className="pricing-modal-kicker">Il te manque des crédits</div>
            <h2 id="pricing-modal-title">Choisis ton offre pour générer</h2>
            <p className="pricing-modal-copy">
              Chaque génération coûte {GENERATION_COST} crédits. Active une offre pour commencer.
            </p>

            <div className="pricing-modal-options">
              {PRICING_OPTIONS.map((option) => (
                <div className="pricing-modal-option" key={option.name}>
                  <div>
                    <strong>{option.name}</strong>
                    <span>{option.details}</span>
                  </div>
                  <b>{option.price}</b>
                </div>
              ))}
            </div>

            <Link
              to="/pricing"
              className="btn btn-primary pricing-modal-cta"
              onClick={() => setShowPricingModal(false)}
            >
              <span>Voir les tarifs</span>
            </Link>
          </section>
        </div>
      )}
    </div>
  );
}
