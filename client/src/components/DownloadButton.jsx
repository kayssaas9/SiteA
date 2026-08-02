import { useState } from "react";
import { getSafeUrl } from "../lib/safeUrl.js";

export default function DownloadButton({
  imageUrl,
  filename = "astra-resultat.jpg",
  className = "",
  children,
  onClick,
}) {
  const [progress, setProgress] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  const downloadImage = async () => {
    if (downloading) return;

    setDownloading(true);
    setProgress(0);
    setError("");

    try {
      const safeImageUrl = getSafeUrl(imageUrl);
      if (!safeImageUrl) throw new Error("image_url_invalid");

      // Opening the same-origin proxy is supported by iOS Safari and avoids
      // Blob/object URLs, which can throw a pattern exception on mobile.
      const link = document.createElement("a");
      link.href = safeImageUrl;
      link.download = filename;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.click();
      setProgress(100);
    } catch (downloadError) {
      console.error("image download error", downloadError);
      setError("Téléchargement direct indisponible");

      const safeImageUrl = getSafeUrl(imageUrl);
      if (safeImageUrl) window.open(safeImageUrl, "_blank", "noopener,noreferrer");
    } finally {
      window.setTimeout(() => {
        setDownloading(false);
        setProgress(0);
      }, 900);
    }
  };

  return (
    <div className="result-download-wrap">
      <button
        type="button"
        className={`${className} ${downloading ? "is-downloading" : ""}`.trim()}
        onClick={(event) => {
          event.stopPropagation();
          onClick?.(event);
          downloadImage();
        }}
        disabled={downloading}
        aria-label={downloading ? `Téléchargement à ${progress}%` : undefined}
      >
        {downloading ? (
          <span className="result-download-progress-content">
            <span>Téléchargement {progress}%</span>
            <span className="result-download-progress-track" aria-hidden="true">
              <span
                className="result-download-progress-bar"
                style={{ width: `${progress}%` }}
              />
            </span>
          </span>
        ) : children}
      </button>
      {error && <span className="result-download-error">{error}</span>}
    </div>
  );
}