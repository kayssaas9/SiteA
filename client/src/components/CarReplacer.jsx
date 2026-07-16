import { useState } from "react";
import ImageUpload from "./ImageUpload.jsx";
import ResultDisplay from "./ResultDisplay.jsx";
import "./Generator.css";

const CAR_PRESETS = [
  "Lamborghini Urus", "Ferrari 488", "Porsche 911 GT3",
  "Mercedes G-Wagon", "Rolls-Royce Phantom", "Tesla Model S Plaid",
  "McLaren 720S", "Bentley Continental GT",
];

export default function CarReplacer() {
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
      form.append("mode", "car");
      form.append("prompt", prompt);
      if (photo?.file) form.append("image", photo.file);

      const res = await fetch("/api/generate", { method: "POST", body: form });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Generation failed");
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
        <label className="gen-label">Your current car <span className="gen-opt">(optional)</span></label>
        <p className="gen-hint">Upload a photo of your car or the scene you want to replace</p>
        <ImageUpload
          label="Upload your car photo"
          hint="Side or 3/4 angle works best"
          value={photo}
          onChange={setPhoto}
        />
      </div>

      <div className="gen-section">
        <label className="gen-label">Dream car</label>
        <p className="gen-hint">Pick a preset or describe the car you want</p>
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
          placeholder="e.g. A midnight blue Lamborghini Urus parked on a Monaco street at sunset"
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
        {loading ? "Generating…" : "🚗 Upgrade My Car"}
      </button>

      <ResultDisplay imageUrl={result} loading={loading} error={error} />
    </div>
  );
}
