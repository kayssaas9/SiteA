import { useRef, useState } from "react";
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

  const handleFile = (file) => {
    if (!file) return;

    // Some mobile pickers provide an empty MIME type, especially for HEIC
    // photos. Let the server inspect and normalize the actual image bytes.
    const hasImageType = file.type?.startsWith("image/");
    const hasImageExtension = /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name || "");
    if (!hasImageType && !hasImageExtension) return;

    const reader = new FileReader();
    reader.onload = () => onChange({ file, preview: reader.result });
    reader.onerror = () => console.error("mobile image preview error", reader.error);
    reader.readAsDataURL(file);
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
          <img src={value.preview} alt="Image ajoutée" />
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
