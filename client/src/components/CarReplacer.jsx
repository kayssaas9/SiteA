import { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import ImageUpload from "./ImageUpload.jsx";
import ResultDisplay from "./ResultDisplay.jsx";
import "./Generator.css";

const CAR_PRESETS = [
  "Lamborghini Urus", "Ferrari 488", "Porsche 911 GT3",
  "Mercedes Classe G", "Rolls-Royce Phantom", "Tesla Model S Plaid",
  "McLaren 720S", "Bentley Continental GT",
];

export default function CarReplacer() {
  const { user } = useUser();
  const [photo, setPhoto] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    if (loading || !prompt.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const form = new FormData();
      form.append("mode", "car");
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
        <label className="gen-label">Votre voiture actuelle <span className="gen-opt">(optionnel)</span></label>
        <p className="gen-hint">Ajoutez une photo de votre voiture ou de la scène à modifier</p>
        <ImageUpload
          label="Ajouter une photo de voiture"
          hint="De profil ou en 3/4 avant recommandé"
          value={photo}
          onChange={setPhoto}
        />
      </div>

      <div className="gen-section">
        <label className="gen-label">Voiture de rêve</label>
        <p className="gen-hint">Choisissez un modèle ou décrivez la voiture souhaitée</p>
        <div className="presets">
          {CAR_PRESETS.map((c) => (
            <button
              key={c}
              className={`preset-chip ${prompt === c ? "active" : ""}`}
              onClick={() => setPrompt(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <textarea
          className="gen-textarea"
          placeholder="Ex. : une Lamborghini Urus bleue nuit garée à Monaco au coucher du soleil"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleGenerate();
            }
          }}
          rows={3}
        />
      </div>

      <button
        className="gen-btn"
        onClick={handleGenerate}
        disabled={loading || !prompt.trim()}
      >
        {loading ? "Génération…" : "🚗 Générer la voiture"}
      </button>

      <ResultDisplay imageUrl={result} loading={loading} error={error} />
    </div>
  );
}
