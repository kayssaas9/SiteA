import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import ImageUpload from "./ImageUpload.jsx";
import { useUserData } from "../hooks/useUserData.js";
import "./ImageGenerator.css";

const GENERATION_COST = 100;
const ACTIVE_GENERATIONS_KEY = "astraActiveGenerationIds";
const PENDING_UNLOCK_KEY = "astraPendingGenerationId";
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

export default function ImageGenerator({ onResultChange }) {
  const { user } = useUser();
  const { plan, refetch: refetchUserData } = useUserData();
  const [mainPhoto, setMainPhoto] = useState(null);
  const [refs, setRefs] = useState({ ref1: null, ref2: null });
  const [showRefs, setShowRefs] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const activeGenerationIdRef = useRef(null);
  const pollGenerationRef = useRef(null);

  const unlockedCount = plan === "expert" ? 2 : plan === "pro" ? 1 : 0;
  const handleRefChange = (slot, value) => {
    setRefs((r) => ({ ...r, [slot]: value }));
  };

  useEffect(() => {
    let cancelled = false;
    const timers = new Map();

    const readActiveIds = () => {
      try {
        return JSON.parse(window.localStorage.getItem(ACTIVE_GENERATIONS_KEY) || "[]");
      } catch {
        return [];
      }
    };

    const writeActiveIds = (ids) => {
      if (ids.length) window.localStorage.setItem(ACTIVE_GENERATIONS_KEY, JSON.stringify(ids));
      else window.localStorage.removeItem(ACTIVE_GENERATIONS_KEY);
    };

    const removeActiveId = (generationId) => {
      writeActiveIds(readActiveIds().filter((id) => id !== generationId));
    };

    const loadGeneration = async (generationId) => {
      if (!generationId || !user?.id || cancelled) return null;

      const res = await fetch(
        `/api/generations/${encodeURIComponent(generationId)}?clerkUserId=${encodeURIComponent(user.id)}&fresh=${Date.now()}`,
        { cache: "no-store", headers: { "Cache-Control": "no-cache" } },
      );
      if (!res.ok) return null;
      return res.json();
    };

    const trackGeneration = async (generationId, attempts = 0) => {
      if (cancelled) return;

      let data;
      try {
        data = await loadGeneration(generationId);
      } catch (trackError) {
        console.error("generation status fetch error", trackError);
      }

      if (cancelled) return;

      if (!data) {
        if (attempts < 120) {
          timers.set(generationId, window.setTimeout(() => trackGeneration(generationId, attempts + 1), 2000));
        }
        return;
      }

      const isCurrent = activeGenerationIdRef.current === generationId;
      if (data.status === "processing" || data.status === "finalizing") {
        if (isCurrent) setLoading(true);
        timers.set(generationId, window.setTimeout(() => trackGeneration(generationId, attempts + 1), 1500));
        return;
      }

      removeActiveId(generationId);

      if (data.status === "failed") {
        if (isCurrent) {
          setLoading(false);
          setError(data.error || "La génération a échoué.");
          onResultChange?.({ loading: false, error: data.error || "La génération a échoué.", result: null });
        }
        if (window.localStorage.getItem(PENDING_UNLOCK_KEY) === generationId) {
          window.localStorage.removeItem(PENDING_UNLOCK_KEY);
        }
        return;
      }

      if (data.imageUrl && isCurrent) {
        const nextResult = {
          imageUrl: data.imageUrl,
          teaser: Boolean(data.teaser),
          generationId: data.id,
        };
        setResult(nextResult);
        setLoading(false);
        setError(null);
        onResultChange?.({ loading: false, error: null, result: nextResult });
        window.dispatchEvent(new Event("astra-user-data-changed"));
      }

      if (data.unlocked) {
        if (window.localStorage.getItem(PENDING_UNLOCK_KEY) === generationId) {
          window.localStorage.removeItem(PENDING_UNLOCK_KEY);
        }
        await refetchUserData();
        return;
      }

      if (data.teaser) {
        window.localStorage.setItem(PENDING_UNLOCK_KEY, generationId);
        // Stripe's webhook may unlock the exact teaser after redirect.
        if (attempts < 40) {
          timers.set(generationId, window.setTimeout(() => trackGeneration(generationId, attempts + 1), 1500));
        }
      }
    };

    pollGenerationRef.current = (generationId) => {
      activeGenerationIdRef.current = generationId;
      const ids = Array.from(new Set([...readActiveIds(), generationId]));
      writeActiveIds(ids);
      trackGeneration(generationId);
    };

    const bootstrap = async () => {
      if (!user?.id) return;

      const pendingUnlock = window.localStorage.getItem(PENDING_UNLOCK_KEY)
        || window.sessionStorage.getItem(PENDING_UNLOCK_KEY);
      if (pendingUnlock) window.localStorage.setItem(PENDING_UNLOCK_KEY, pendingUnlock);

      const ids = new Set([...readActiveIds(), pendingUnlock].filter(Boolean));
      try {
        const historyRes = await fetch(`/api/history/${encodeURIComponent(user.id)}?fresh=${Date.now()}`, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });
        if (historyRes.ok) {
          const history = await historyRes.json();
          history
            .filter((item) => item.status === "processing" || item.status === "finalizing")
            .forEach((item) => ids.add(item.id));
        }
      } catch (historyError) {
        console.error("active generation discovery error", historyError);
      }

      const activeIds = [...ids];
      writeActiveIds(activeIds.filter((id) => id !== pendingUnlock));
      if (activeIds.length) {
        activeGenerationIdRef.current = activeIds[activeIds.length - 1];
        setLoading(true);
        onResultChange?.({ loading: true, error: null, result: null });
        activeIds.forEach((id) => trackGeneration(id));
      }
    };

    bootstrap();
    return () => {
      cancelled = true;
      timers.forEach((timer) => window.clearTimeout(timer));
      pollGenerationRef.current = null;
    };
  }, [refetchUserData, user?.id]);

  const handleGenerate = async () => {
    if (loading || !prompt.trim()) return;
    setError(null);
    setResult(null);
    onResultChange?.({ loading: true, error: null, result: null });

    setLoading(true);

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
        if (res.status === 402 && data.code === "FREE_TEASER_USED") {
          setLoading(false);
          setError(null);
          setShowPricingModal(true);
          onResultChange?.({ loading: false, error: null, result: null });
          return;
        }
        throw new Error(data.error || "La génération a échoué");
      }
      if (data.generationId) {
        activeGenerationIdRef.current = data.generationId;
        window.localStorage.setItem(
          ACTIVE_GENERATIONS_KEY,
          JSON.stringify([data.generationId]),
        );
        setLoading(true);
        pollGenerationRef.current?.(data.generationId);
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
      onResultChange?.({ loading: false, error: err.message, result: null });
    } finally {
      // Keep the loading state while the persisted OneShot job is running.
    }
  };

  if (loading) {
    return (
      <div className="generation-progress" role="status" aria-live="polite">
        <div className="generation-progress-orbit" aria-hidden="true">
          <span />
          <span />
          <span />
          <div className="generation-progress-spark">✦</div>
        </div>
        <p className="generation-progress-title">Ton rendu est en préparation</p>
        <p className="generation-progress-subtitle">
          Astra transforme ta photo en une image ultra-réaliste…
        </p>
        <div className="generation-progress-steps" aria-hidden="true">
          <span className="active">Analyse de ta photo</span>
          <i />
          <span>Création du rendu</span>
          <i />
          <span>Finitions</span>
        </div>
      </div>
    );
  }

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
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleGenerate();
            }
          }}
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

      {showPricingModal && (
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
              Ton aperçu gratuit a déjà été utilisé. Active un abonnement pour continuer à générer.
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
              Voir les tarifs
            </Link>
          </section>
        </div>
      )}

    </div>
  );
}
