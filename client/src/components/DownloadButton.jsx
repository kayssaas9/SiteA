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

  const downloadImage = async () => {
    if (downloading) return;

    setDownloading(true);
    setProgress(0);

    try {
      const safeImageUrl = getSafeUrl(imageUrl);
      if (!safeImageUrl) throw new Error("image_url_invalid");

      // Open the same-origin proxy directly in a new tab. Keeping this call
      // inside the click handler avoids mobile popup blockers and lets the
      // browser's image viewer handle saving/sharing.
      const newTab = window.open(safeImageUrl, "_blank", "noopener,noreferrer");
      if (!newTab) throw new Error("popup_blocked");
      setProgress(100);
    } catch (downloadError) {
      console.error("image download error", downloadError);

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
    </div>
  );
}