import { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import ImageUpload from "./ImageUpload.jsx";
import ResultDisplay from "./ResultDisplay.jsx";
import { useUserData } from "../hooks/useUserData.js";
import "./ImageGenerator.css";

export default function ImageGenerator({
  mode,
  presets = [],
  mainLabel = "Photo principale",
  mainHint = "Image à modifier ou utiliser comme référence principale",
  promptLabel = "Ta demande",
  promptHint = "Décris ce que tu veux générer",
  promptPlaceholder = "Ex. : une tenue streetwear noire avec un hoodie oversize et un cargo",
  generateLabel = "Générer",
}) {
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
      form.append("mode", mode);
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
    <div className="generator image-generator">
      <div className="gen-section main-upload-section">
        <label className="gen-label">
          {mainLabel} <span className="gen-opt">(optionnel)</span>
        </label>
        <p className="gen-hint">{mainHint}</p>
        <ImageUpload
          label="Ajouter une image"
          hint="Plein pied, profil ou 3/4 avant recommandé"
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
          <span>{showRefs ? "−" : "+"}</span> Ajouter des références
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
        <label className="gen-label">{promptLabel}</label>
        <p className="gen-hint">{promptHint}</p>
        {presets.length > 0 && (
          <div className="presets">
            {presets.map((p) => (
              <button
                key={p}
                className={`preset-chip ${prompt === p ? "active" : ""}`}
                onClick={() => setPrompt(p)}
              >
                {p}
              </button>
            ))}
          </div>
        )}
        <textarea
          className="gen-textarea"
          placeholder={promptPlaceholder}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
        />
      </div>

      <div className="gen-submit">
        <button
          className="gen-btn"
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
        >
          {loading ? "Génération…" : `✨ ${generateLabel}`}
        </button>
        <span className="gen-cost">100 crédits par génération</span>
      </div>

      <ResultDisplay imageUrl={result} loading={loading} error={error} />
    </div>
  );
}
