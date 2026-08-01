import "./ResultDisplay.css";

export default function ResultDisplay({
  imageUrl,
  loading,
  loadingMessage = "Génération en cours…",
  loadingSubtext = "Cela prend généralement 10 à 30 secondes",
  error,
}) {
  if (loading) {
    return (
      <div className="result-box loading">
        <div className="spinner" />
        <p className="result-status">{loadingMessage}</p>
        <p className="result-sub">{loadingSubtext}</p>
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
