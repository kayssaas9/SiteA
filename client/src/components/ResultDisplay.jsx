import "./ResultDisplay.css";

export default function ResultDisplay({ imageUrl, loading, error }) {
  if (loading) {
    return (
      <div className="result-box loading">
        <div className="spinner" />
        <p className="result-status">Generating your image…</p>
        <p className="result-sub">This usually takes 10–30 seconds</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="result-box error">
        <div className="result-error-icon">⚠️</div>
        <p className="result-status">Something went wrong</p>
        <p className="result-sub">{error}</p>
      </div>
    );
  }

  if (!imageUrl) return null;

  return (
    <div className="result-box success">
      <div className="result-label">✨ Your result</div>
      <img className="result-img" src={imageUrl} alt="Generated result" />
      <a
        className="result-download"
        href={imageUrl}
        download="nano-banana-result.jpg"
        target="_blank"
        rel="noreferrer"
      >
        ⬇ Download
      </a>
    </div>
  );
}
