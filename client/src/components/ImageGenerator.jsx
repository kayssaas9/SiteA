import { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import ImageUpload from "./ImageUpload.jsx";
import ResultDisplay from "./ResultDisplay.jsx";
import { useUserData } from "../hooks/useUserData.js";
import "./ImageGenerator.css";

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
  const { plan } = useUserData();
  const [mainPhoto, setMainPhoto] = useState(null);
  const [refs, setRefs] = useState({ ref1: null, ref2: null });
  const [showRefs, setShowRefs] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const unlockedCount = plan === "expert" ? 2 : plan === "pro" ? 1 : 0;

  const handleRefChange = (slot, value) => {
    setRefs((r) => ({ ...r, [slot]: value }));
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

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

      if (!res.ok) throw new Error(data.error || "La génération a échoué");
      setResult(data.imageUrl);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
          {loading ? "Génération…" : "Générer — 100 crédits"}
        </button>
      </div>

      <ResultDisplay imageUrl={result} loading={loading} error={error} />
    </div>
  );
}
