import { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import ImageUpload from "./ImageUpload.jsx";
import ResultDisplay from "./ResultDisplay.jsx";
import "./Generator.css";

const STYLE_PRESETS = [
  "Streetwear", "Tenue de bureau", "Costume", "Robe d'été",
  "Sportswear", "Y2K", "Bohème chic", "Minimaliste",
];

export default function OutfitGenerator() {
  const { user } = useUser();
  const [photo, setPhoto] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const form = new FormData();
      form.append("mode", "outfit");
      form.append("prompt", prompt);
      form.append("clerk_user_id", user?.id || "");
      if (photo?.file) form.append("image", photo.file);

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

  return (
    <div className="generator">
      <div className="gen-section">
        <label className="gen-label">Votre photo <span className="gen-opt">(optionnel)</span></label>
        <p className="gen-hint">Ajoutez une photo pour visualiser la tenue sur vous</p>
        <ImageUpload
          label="Ajouter votre photo"
          hint="Plein pied ou portrait recommandé"
          value={photo}
          onChange={setPhoto}
        />
      </div>

      <div className="gen-section">
        <label className="gen-label">Description de la tenue</label>
        <p className="gen-hint">Décrivez le look, ou choisissez un style ci-dessous</p>
        <div className="presets">
          {STYLE_PRESETS.map((p) => (
            <button
              key={p}
              className={`preset-chip ${prompt === p ? "active" : ""}`}
              onClick={() => setPrompt(p)}
            >
              {p}
            </button>
          ))}
        </div>
        <textarea
          className="gen-textarea"
          placeholder="Ex. : une tenue streetwear toute noire avec un hoodie oversize et un cargo"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
        />
      </div>

      <button
        className="gen-btn"
        onClick={handleGenerate}
        disabled={loading || !prompt.trim()}
      >
        {loading ? "Génération…" : "✨ Générer la tenue"}
      </button>

      <ResultDisplay imageUrl={result} loading={loading} error={error} />
    </div>
  );
}
