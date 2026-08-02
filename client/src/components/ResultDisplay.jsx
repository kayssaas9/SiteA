import "./ResultDisplay.css";
import { Link } from "react-router-dom";

export default function ResultDisplay({
  imageUrl,
  teaser = false,
  loading,
  loadingMessage = "Génération en cours…",
  loadingSubtext = "Cela prend généralement 10 à 30 secondes",
  error,
  showEmpty = false,
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

  if (!imageUrl && showEmpty) {
    return (
      <div className="result-box empty">
        <div className="result-empty-icon" aria-hidden="true">✦</div>
        <p className="result-status">En attente de génération</p>
        <p className="result-sub">Ton prochain résultat apparaîtra ici</p>
      </div>
    );
  }

  if (!imageUrl) return null;

  return (
    <div className="result-box success">
      <div className="result-label">
        {teaser ? "✨ Aperçu de votre résultat" : "✨ Votre résultat"}
      </div>
      <div className={`result-visual ${teaser ? "is-teaser" : ""}`}>
        <img className="result-img" src={imageUrl} alt={teaser ? "Aperçu flouté du résultat" : "Résultat généré"} />
        {teaser && (
          <div className="result-teaser-overlay">
            <p>Ton résultat est prêt</p>
            <span>Débloque l'image en qualité nette</span>
            <Link className="result-unlock-btn" to="/pricing">
              Débloquer maintenant
            </Link>
          </div>
        )}
      </div>
      {!teaser && (
        <a
          className="result-download"
          href={imageUrl}
          download="astra-resultat.jpg"
          target="_blank"
          rel="noreferrer"
        >
          ⬇ Télécharger
        </a>
      )}
    </div>
  );
}
