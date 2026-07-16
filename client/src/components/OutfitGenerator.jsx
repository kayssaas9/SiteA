import { useState } from "react";
import ImageUpload from "./ImageUpload.jsx";
import ResultDisplay from "./ResultDisplay.jsx";
import "./Generator.css";

const STYLE_PRESETS = [
  "Streetwear", "Business casual", "Formal suit", "Summer dress",
  "Athleisure", "Y2K", "Boho chic", "Minimalist",
];

export default function OutfitGenerator() {
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
        <label className="gen-label">Your photo <span className="gen-opt">(optional)</span></label>
        <p className="gen-hint">Upload a photo to visualise the outfit on you</p>
        <ImageUpload
          label="Upload your photo"
          hint="Full-body or portrait works best"
          value={photo}
          onChange={setPhoto}
        />
      </div>

      <div className="gen-section">
        <label className="gen-label">Outfit description</label>
        <p className="gen-hint">Describe the look, or pick a style below</p>
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
          placeholder="e.g. A stylish all-black streetwear outfit with oversized hoodie and cargo pants"
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
        {loading ? "Generating…" : "✨ Generate Outfit"}
      </button>

      <ResultDisplay imageUrl={result} loading={loading} error={error} />
    </div>
  );
}
