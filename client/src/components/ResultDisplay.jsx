import { useRef } from "react";
import { Link } from "react-router-dom";
import DownloadButton from "./DownloadButton.jsx";
import { formatDailyGenerationCount } from "../lib/liveGenerationCounter.js";
import { getSafeUrl } from "../lib/safeUrl.js";
import "./ResultDisplay.css";

export default function ResultDisplay({
  imageUrl,
  teaser = false,
  loading,
  loadingMessage = "Génération en cours…",
  loadingSubtext = "Cela prend généralement 10 à 30 secondes",
  error,
  showEmpty = false,
  showcase = false,
  onNewGeneration,
}) {
  const imageFrameRef = useRef(null);
  const safeImageUrl = getSafeUrl(imageUrl, { allowDataImage: true });

  const handleFullscreen = async () => {
    const frame = imageFrameRef.current;
    if (!frame) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (frame.requestFullscreen) {
        await frame.requestFullscreen();
      }
    } catch (fullscreenError) {
      console.error("fullscreen error", fullscreenError);
    }
  };

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

  if (!safeImageUrl && showEmpty) {
    return (
      <div className="result-box empty">
        <div className="result-empty-icon" aria-hidden="true">✦</div>
        <p className="result-status">En attente de génération</p>
        <p className="result-sub">Ton prochain résultat apparaîtra ici</p>
      </div>
    );
  }

  if (!safeImageUrl) {
    if (!loading && !error) {
      return (
        <div className="result-box error">
          <div className="result-error-icon">⚠️</div>
          <p className="result-status">Résultat indisponible</p>
          <p className="result-sub">L’adresse de l’image reçue est invalide. Relance la génération.</p>
        </div>
      );
    }
    return null;
  }

  if (showcase && !teaser) {
    return (
      <div className="result-box result-credit-showcase">
        <div className="result-credit-image-frame" ref={imageFrameRef}>
            <img className="result-credit-image" src={safeImageUrl} alt="Résultat généré" />
        </div>

        <div className="result-credit-actions">
          <Link className="result-credit-action result-credit-action-snaprouge" to="/snaprouge">
            Envoyer avec SnapRouge
          </Link>
          <DownloadButton
            className="result-credit-action result-credit-action-download"
            imageUrl={safeImageUrl}
          >
            Télécharger
          </DownloadButton>
          <button
            type="button"
            className="result-credit-action result-credit-action-fullscreen"
            onClick={handleFullscreen}
          >
            Agrandir
          </button>
        </div>
      </div>
    );
  }

  if (showcase) {
    const generationCount = formatDailyGenerationCount();
    const reviews = [
      { author: "Arthur_M78", text: "Cette IA me met une tempête aux autres, je vous recommande !" },
      { author: "Sarah_H", text: "Super réaliste, j'étais un peu sceptique au début mais c'est absolument parfait." },
      { author: "Nextaz_Goat", text: "Merci beaucoup vous avez fait un super travail. C'est un des meilleurs sites que j'ai eu." },
      { author: "Marc_Ant75", text: "Site très sérieux qui ne cesse de s'améliorer de jour en jour." },
    ];

    return (
      <div className={`result-box result-showcase ${teaser ? "is-teaser" : "is-unlocked"}`}>
        <div className="result-showcase-grid">
          <div className="result-showcase-media">
            <div className="result-showcase-media-badge">✦ APERÇU ASTRA</div>
            <div className={`result-visual ${teaser ? "is-teaser" : ""}`}>
              <img
                className="result-img"
                src={safeImageUrl}
                alt={teaser ? "Aperçu flouté du résultat" : "Résultat généré"}
              />
            </div>
            <div className="result-social-proof">
              <span className="result-social-avatars" aria-hidden="true">👥</span>
              <strong>{generationCount}</strong> personnes ont généré une image aujourd'hui
            </div>
            {teaser ? (
              <Link className="result-showcase-bottom-cta" to="/pricing">
                <span aria-hidden="true">🔒</span>
                Débloquer ma photo maintenant
              </Link>
            ) : (
              <DownloadButton
                className="result-showcase-bottom-cta"
                 imageUrl={safeImageUrl}
              >
                ⬇ Télécharger mon résultat
              </DownloadButton>
            )}
          </div>

          <div className="result-showcase-panel">
            <div className="result-showcase-kicker">TON RENDU PERSONNALISÉ</div>
            <h2>{teaser ? "Ton résultat est prêt" : "Ton rendu est prêt"}</h2>
            <p className="result-showcase-copy">
              {teaser
                ? "Imagine la réaction de tes amis quand ils verront ça. Débloque la version HD sans floutage pour l'envoyer directement."
                : "Ton rendu personnalisé est prêt à être téléchargé et partagé."}
            </p>

            {teaser ? (
              <Link className="result-showcase-cta" to="/pricing">
                <span aria-hidden="true">🔒</span>
                Accéder à la version sans floutage
              </Link>
            ) : (
              <DownloadButton
                className="result-showcase-cta"
                imageUrl={safeImageUrl}
              >
                ⬇ Télécharger la version HD
              </DownloadButton>
            )}

            {onNewGeneration && (
              <button
                type="button"
                className="result-new-generation"
                onClick={onNewGeneration}
              >
                ← Créer une nouvelle image
              </button>
            )}

            <div className="result-guarantee">
              <span aria-hidden="true">✓</span>
              <strong>Satisfait ou remboursé immédiatement</strong>
            </div>
            <div className="result-secure">♙ Paiement sécurisé via Stripe</div>

            <div className="result-showcase-stats">
              <span className="result-stat-avatars" aria-hidden="true">👨🏻‍🚀👩🏽‍🎨🧑🏼‍🔧</span>
              <strong>{generationCount}</strong>
              <span>personnes ont généré une photo aujourd'hui</span>
            </div>

            <div className="result-reviews" aria-label="Avis clients">
              <div className="result-reviews-header">
                <strong>Ils ont testé Astra</strong>
                <span>★★★★★</span>
              </div>
              <div className="result-reviews-scroll">
                {reviews.map((review) => (
                  <article className="result-review-card" key={review.author}>
                    <div className="result-review-stars" aria-label="5 étoiles">★★★★★</div>
                    <p>“{review.text}”</p>
                    <strong>— {review.author}</strong>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="result-box success">
      <div className="result-label">
        {teaser ? "✨ Aperçu de votre résultat" : "✨ Votre résultat"}
      </div>
      <div className={`result-visual ${teaser ? "is-teaser" : ""}`}>
        <img className="result-img" src={safeImageUrl} alt={teaser ? "Aperçu flouté du résultat" : "Résultat généré"} />
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
        <DownloadButton
          className="result-download"
          imageUrl={safeImageUrl}
        >
          ⬇ Télécharger
        </DownloadButton>
      )}
    </div>
  );
}
