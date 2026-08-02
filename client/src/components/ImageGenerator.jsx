import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import ImageUpload from "./ImageUpload.jsx";
import { useUserData } from "../hooks/useUserData.js";
import { getSafeUrl } from "../lib/safeUrl.js";
import { appendUploadFile } from "../lib/mobileUpload.js";
import "./ImageGenerator.css";

const GENERATION_COST = 100;
const ACTIVE_GENERATIONS_KEY = "astraActiveGenerationIds";
const PENDING_UNLOCK_KEY = "astraPendingGenerationId";
const PRICING_OPTIONS = [
  { name: "Basique", price: "9,99 €", details: "2 500 crédits / mois" },
  { name: "Pro", price: "19,99 €", details: "7 500 crédits / mois" },
  { name: "Expert", price: "39,99 €", details: "Crédits illimités" },
];

const GENERATION_MESSAGES = [
  "Analyse de ta photo",
  "Ajustement de la lumière",
  "Activation du rendu cinématique",
  "Reconstruction des détails de la voiture",
  "Harmonisation des couleurs",
  "Ajout des finitions réalistes",
  "Dernière vérification du rendu",
];

function getErrorMessage(value, fallback = "La génération a échoué.") {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (value instanceof Error && value.message) return value.message;
  if (value && typeof value === "object") {
    for (const key of ["message", "error", "detail", "description"]) {
      const nested = getErrorMessage(value[key], "");
      if (nested) return nested;
    }
    try {
      const serialized = JSON.stringify(value);
      if (serialized && serialized !== "{}") return serialized;
    } catch {
      // Keep a readable fallback for unexpected structured errors.
    }
  }
  return fallback;
}

function getFriendlyGenerationError(message) {
  const readableMessage = getErrorMessage(message);
  if (/ne peut pas être convertie|format.*(jpg|png)|heic|heif/i.test(readableMessage)) {
    return "Cette photo mobile n’est pas compatible. Enregistre-la en JPG ou PNG, puis réessaie.";
  }
  if (/string did not match the pattern|invalid url|url d.?image/i.test(readableMessage)) {
    return "Le service d’image a renvoyé un résultat invalide. Réessaie avec une autre image ou description.";
  }
  return readableMessage;
}

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

export default function ImageGenerator({ onResultChange, skipResume = false }) {
  const { user } = useUser();
  const { plan, refetch: refetchUserData } = useUserData();
  const [mainPhoto, setMainPhoto] = useState(null);
  const [refs, setRefs] = useState({ ref1: null, ref2: null });
  const [showRefs, setShowRefs] = useState(false);
  const [hasPrompt, setHasPrompt] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationMessageIndex, setGenerationMessageIndex] = useState(0);
  const [error, setError] = useState(null);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [pricingMessage, setPricingMessage] = useState(
    "Ton aperçu gratuit a déjà été utilisé. Active un abonnement pour continuer à générer.",
  );
  const promptValueRef = useRef("");
  const promptRef = useRef(null);
  const activeGenerationIdRef = useRef(null);
  const pollGenerationRef = useRef(null);

  const unlockedCount = plan === "expert" ? 2 : plan === "pro" ? 1 : 0;

  useEffect(() => {
    if (!loading) {
      setGenerationProgress(0);
      setGenerationMessageIndex(0);
      return undefined;
    }

    setGenerationProgress((current) => Math.max(current, 8));
    const messageTimer = window.setInterval(() => {
      setGenerationMessageIndex((current) => (
        (current + 1) % GENERATION_MESSAGES.length
      ));
    }, 3000);
    const progressTimer = window.setInterval(() => {
      setGenerationProgress((current) => {
        if (current >= 92) return current;
        const increment = current < 35 ? 7 : current < 70 ? 4 : 2;
        return Math.min(92, current + increment);
      });
    }, 1200);

    return () => {
      window.clearInterval(progressTimer);
      window.clearInterval(messageTimer);
    };
  }, [loading]);

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
          const friendlyError = getFriendlyGenerationError(data.error);
          setError(friendlyError);
          onResultChange?.({ loading: false, error: friendlyError, result: null });
        }
        if (window.localStorage.getItem(PENDING_UNLOCK_KEY) === generationId) {
          window.localStorage.removeItem(PENDING_UNLOCK_KEY);
        }
        return;
      }

      const safeImageUrl = getSafeUrl(data.imageUrl, { allowDataImage: true });
      if (safeImageUrl && isCurrent) {
        const nextResult = {
          imageUrl: safeImageUrl,
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

      if (skipResume) {
        activeGenerationIdRef.current = null;
        return;
      }

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
  }, [refetchUserData, skipResume, user?.id]);

  const handleGenerate = async () => {
    const prompt = promptValueRef.current.trim();
    if (loading || !prompt) return;
    setError(null);
    setResult(null);
    onResultChange?.({ loading: true, error: null, result: null });

    setLoading(true);

    try {
      const form = new FormData();
      form.append("mode", "car");
      form.append("prompt", prompt);
      form.append("clerk_user_id", user?.id || "");
      const [mainFile, ref1File, ref2File] = [
        mainPhoto?.file || null,
        unlockedCount >= 1 ? refs.ref1?.file || null : null,
        unlockedCount >= 2 ? refs.ref2?.file || null : null,
      ];
       appendUploadFile(form, "image", mainFile);
       appendUploadFile(form, "reference_1", ref1File, "astra-reference-1.jpg");
       appendUploadFile(form, "reference_2", ref2File, "astra-reference-2.jpg");

       const res = await fetch("/api/generate", {
         method: "POST",
         body: form,
         cache: "no-store",
         headers: { Accept: "application/json" },
       });
       const responseText = await res.text();
       let data = {};
       try {
         data = responseText ? JSON.parse(responseText) : {};
       } catch {
         throw new Error(`Le serveur a renvoyé une réponse invalide (${res.status}).`);
       }

      if (!res.ok) {
        if (res.status === 402) {
          setLoading(false);
          setError(null);
          setPricingMessage(
            data.code === "INSUFFICIENT_CREDITS"
              ? "Il te faut au moins 100 crédits pour générer une image nette. Recharge ton compte pour continuer."
              : "Ton aperçu gratuit a déjà été utilisé. Active un abonnement pour continuer à générer.",
          );
          setShowPricingModal(true);
          onResultChange?.({ loading: false, error: null, result: null });
          return;
        }
        throw new Error(getErrorMessage(data.error));
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
      const friendlyError = getFriendlyGenerationError(err.message);
      setError(friendlyError);
      setLoading(false);
      onResultChange?.({ loading: false, error: friendlyError, result: null });
    } finally {
      // Keep the loading state while the persisted OneShot job is running.
    }
  };

  if (loading) {
    return (
      <div className="generation-progress" role="status" aria-live="polite">
        <div className="generation-progress-orbit" aria-hidden="true">
          <span className="generation-progress-arc" />
          <strong className="generation-progress-mark">A</strong>
        </div>
        <p className="generation-progress-title">
          {GENERATION_MESSAGES[generationMessageIndex]}
        </p>
        <p className="generation-progress-subtitle">
          Astra transforme ta photo en une image ultra-réaliste…
        </p>
        <div className="generation-progress-meter">
          <div className="generation-progress-meta">
            <span>Création de ton image</span>
            <strong>{generationProgress}%</strong>
          </div>
          <div
            className="generation-progress-track"
            role="progressbar"
            aria-label="Progression de la création de l'image"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={generationProgress}
          >
            <span style={{ width: `${generationProgress}%` }} />
          </div>
        </div>
        <div className="generation-progress-steps" aria-hidden="true">
          <span className="active">{GENERATION_MESSAGES[generationMessageIndex]}</span>
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
          ref={promptRef}
          defaultValue={promptValueRef.current}
          onInput={(e) => {
            promptValueRef.current = e.currentTarget.value;
            const nextHasPrompt = Boolean(e.currentTarget.value.trim());
            setHasPrompt((previous) => (
              previous === nextHasPrompt ? previous : nextHasPrompt
            ));
          }}
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
          disabled={loading || !hasPrompt}
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
              {pricingMessage}
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
