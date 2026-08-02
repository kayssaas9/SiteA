const SAFE_UPLOAD_NAME = "astra-photo.jpg";

/**
 * Safari can reject camera File metadata while constructing a multipart
 * request. Keep the bytes, but replace the device filename and MIME metadata
 * with safe values. The server detects and normalizes the actual bytes.
 */
export function toUploadPart(file, filename = SAFE_UPLOAD_NAME) {
  if (!file || typeof file.slice !== "function") return file;

  return file.slice(
    0,
    file.size,
    typeof file.type === "string" && file.type
      ? file.type
      : "application/octet-stream",
  );
}

export function appendUploadFile(form, fieldName, file, filename = SAFE_UPLOAD_NAME) {
  if (!file) return;
  const part = toUploadPart(file, filename);
  form.append(fieldName, part, filename);
}