import { useRef, useState } from "react";
import "./ImageUpload.css";

export default function ImageUpload({ label, hint, onChange, value }) {
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

  return (
    <div
      className={`upload-zone ${dragging ? "dragging" : ""} ${value ? "has-image" : ""}`}
      onClick={() => !value && inputRef.current.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      {value ? (
        <div className="upload-preview">
          <img src={value.preview} alt="Uploaded" />
          <button
            className="upload-remove"
            onClick={(e) => { e.stopPropagation(); onChange(null); }}
            title="Remove"
          >
            ✕
          </button>
        </div>
      ) : (
        <div className="upload-placeholder">
          <div className="upload-icon">📁</div>
          <div className="upload-label">{label || "Upload image"}</div>
          <div className="upload-hint">{hint || "PNG, JPG up to 10 MB · Click or drag & drop"}</div>
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
