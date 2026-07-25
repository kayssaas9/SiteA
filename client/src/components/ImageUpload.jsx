import { useRef, useState } from "react";
import "./ImageUpload.css";

const CameraIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="32" height="32">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
);

export default function ImageUpload({ label, hint, onChange, value, variant = "default" }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    onChange({ file, preview: url });
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const isMain = variant === "main";

  return (
    <div
      className={`upload-zone ${isMain ? "upload-zone-main" : ""} ${dragging ? "dragging" : ""} ${value ? "has-image" : ""}`}
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
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => handleFile(e.target.files[0])}
      />
    </div>
  );
}
