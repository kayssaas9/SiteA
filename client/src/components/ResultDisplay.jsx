import "./ResultDisplay.css";

export default function ResultDisplay({ imageUrl, loading, error }) {
  if (loading) {
    return (
      <div className="result-box loading">
        <div className="spinner" />
        <p className="result-status">Génération en cours…</p>
        <p className="result-sub">Cela prend généralement 10 à 30 secondes</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="result-box error">
        <div className="result-error-icon">⚠️</div>
        <p className="result-status">Une erreur est survenue</p>
        <p className="result-sub">{error}</p>
      </div>
    );
  }

  if (!imageUrl) return null;

  return (
    <div className="result-box success">
      <div className="result-label">✨ Votre résultat</div>
      <img className="result-img" src={imageUrl} alt="Résultat généré" />
      <a
        className="result-download"
        href={imageUrl}
        download="astra-resultat.jpg"
        target="_blank"
        rel="noreferrer"
      >
        ⬇ Télécharger
      </a>
    </div>
  );
}
