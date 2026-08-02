import { useState } from "react";

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
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error(`download_${response.status}`);

      const total = Number(response.headers.get("content-length")) || 0;
      const reader = response.body?.getReader();
      let blob;

      if (!reader) {
        blob = await response.blob();
        setProgress(100);
      } else {
        const chunks = [];
        let received = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          received += value.length;
          if (total > 0) {
            setProgress(Math.min(99, Math.round((received / total) * 100)));
          }
        }

        blob = new Blob(chunks, {
          type: response.headers.get("content-type") || "image/jpeg",
        });
        setProgress(100);
      }

      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (downloadError) {
      console.error("image download error", downloadError);
      setError("Téléchargement direct indisponible");

      const fallback = document.createElement("a");
      fallback.href = imageUrl;
      fallback.download = filename;
      fallback.target = "_blank";
      fallback.rel = "noreferrer";
      fallback.click();
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