import { useEffect, useRef, useState } from "react";
import { appendUploadFile, prepareUploadFile } from "../lib/mobileUpload.js";
import "./ImageUpload.css";

const CameraIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="32" height="32">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
);

const PhotoPlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="32" height="32">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
    <path d="M18 8v6M15 11h6" strokeWidth="2" />
  </svg>
);

export default function ImageUpload({ label, hint, onChange, value, variant = "default" }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewState, setPreviewState] = useState("idle");

  useEffect(() => {
    if (!value?.file || typeof window === "undefined") {
      setPreviewUrl(null);
      setPreviewState("idle");
      return undefined;
    }

    let cancelled = false;
    if (typeof value.preview === "string" && value.preview) {
      setPreviewUrl(value.preview);
      setPreviewState("ready");
      return undefined;
    }

    const form = new FormData();
    appendUploadFile(form, "image", value.file);
    setPreviewUrl(null);
    setPreviewState("loading");

    fetch("/api/image-preview", {
      method: "POST",
      body: form,
      cache: "no-store",
      headers: { Accept: "application/json" },
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok || typeof data.preview !== "string") {
          throw new Error(data.error || "Aperçu indisponible");
        }
        if (!cancelled) {
          setPreviewUrl(data.preview);
          setPreviewState("ready");
        }
      })
      .catch((previewError) => {
        if (!cancelled) {
          console.warn("Aperçu serveur indisponible, upload maintenu.", previewError);
          setPreviewUrl(null);
          setPreviewState("failed");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [value?.file, value?.preview]);

  const handleFile = async (file) => {
    if (!file) return;

    // Some mobile pickers provide an empty MIME type, especially for HEIC
    // photos. Let the server inspect and normalize the actual image bytes.
    const hasImageType = file.type?.startsWith("image/");
    const hasImageExtension = /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name || "");
    if (!hasImageType && !hasImageExtension) return;

    try {
      const prepared = await prepareUploadFile(file);
      onChange(prepared);
    } catch (prepareError) {
      console.warn("Mobile image preparation failed, keeping original.", prepareError);
      onChange({ file, preview: null });
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const isMain = variant === "main";
  const isReference = variant === "reference";

  return (
    <div
      className={`upload-zone ${isMain ? "upload-zone-main" : ""} ${isReference ? "upload-zone-reference" : ""} ${dragging ? "dragging" : ""} ${value ? "has-image" : ""}`}
      onClick={() => !value && inputRef.current.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      {value ? (
        <div className="upload-preview">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Photo sélectionnée"
              onError={() => {
                setPreviewUrl(null);
                setPreviewState("failed");
              }}
            />
          ) : previewState === "loading" ? (
            <div className="upload-preview-loading" role="status" aria-live="polite">
              <span className="upload-preview-spinner" aria-hidden="true" />
              <span>Préparation de l’aperçu…</span>
            </div>
          ) : (
            <div className="upload-preview-fallback">
              <span aria-hidden="true">{previewState === "failed" ? "!" : "✓"}</span>
              <span>
                {previewState === "failed"
                  ? "Aperçu indisponible — réessaie après publication"
                  : (value.file?.name || "Photo sélectionnée")}
              </span>
            </div>
          )}
          <button
            className="upload-remove"
            onClick={(e) => { e.stopPropagation(); onChange(null); }}
            title="Supprimer"
          >
            ✕
          </button>
        </div>
      ) : isMain ? (
        <div className="upload-placeholder-main">
          <div className="upload-icon-main"><CameraIcon /></div>
          <div className="upload-label-main">TA PHOTO</div>
          <div className="upload-hint-main">Touche pour importer</div>
        </div>
      ) : isReference ? (
        <div className="upload-placeholder-reference">
          <div className="upload-icon-reference"><PhotoPlusIcon /></div>
          <div className="upload-label-reference">{label || "Référence"}</div>
          <div className="upload-hint-reference">{hint || "PNG, JPG · Cliquez ou glissez"}</div>
        </div>
      ) : (
        <div className="upload-placeholder">
          <div className="upload-icon">📁</div>
          <div className="upload-label">{label || "Ajouter une image"}</div>
          <div className="upload-hint">{hint || "PNG, JPG jusqu'à 10 Mo · Cliquez ou glissez-déposez"}</div>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        style={{ display: "none" }}
        onChange={(e) => handleFile(e.target.files[0])}
      />
    </div>
  );
}
