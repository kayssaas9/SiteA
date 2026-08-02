const SAFE_UPLOAD_NAME = "astra-photo.jpg";
const MAX_UPLOAD_DIMENSION = 1800;
const MAX_UPLOAD_BYTES = 900_000;

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

function canvasBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Impossible de compresser cette image."))),
      "image/jpeg",
      quality,
    );
  });
}

async function fileAsDataUrl(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  const mime = file.type || "image/jpeg";
  return `data:${mime};base64,${btoa(binary)}`;
}

async function decodeImageFallback(file) {
  const source = await fileAsDataUrl(file);
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Ce format d’image n’est pas lisible par le navigateur."));
    image.src = source;
  });
}

/**
 * Prepare a mobile photo before it reaches a serverless function.
 * Vercel rejects large multipart requests before the API handler runs, so
 * browser-readable photos are resized and converted to a compact JPEG here.
 * The returned data URL also restores the immediate local preview.
 */
export async function prepareUploadFile(file) {
  if (!file || typeof window === "undefined") {
    return { file, preview: null };
  }

  let bitmap;
  try {
    bitmap = typeof createImageBitmap === "function"
      ? await createImageBitmap(file)
      : await decodeImageFallback(file);
  } catch {
    try {
      bitmap = await decodeImageFallback(file);
    } catch {
      return { file, preview: null };
    }
  }

  try {
    const longestSide = Math.max(bitmap.width, bitmap.height);
    const scale = Math.min(1, MAX_UPLOAD_DIMENSION / longestSide);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) return { file, preview: null };

    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    let compressed = await canvasBlob(canvas, 0.82);
    if (compressed.size > MAX_UPLOAD_BYTES) compressed = await canvasBlob(canvas, 0.68);
    if (compressed.size > MAX_UPLOAD_BYTES) compressed = await canvasBlob(canvas, 0.54);
    if (compressed.size > MAX_UPLOAD_BYTES) compressed = await canvasBlob(canvas, 0.4);

    return {
      file: compressed,
      preview: canvas.toDataURL("image/jpeg", 0.72),
    };
  } finally {
    bitmap.close?.();
  }
}
