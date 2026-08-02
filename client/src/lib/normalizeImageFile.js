function isHeicFile(file) {
  return /heic|heif/i.test(`${file?.type || ""} ${file?.name || ""}`);
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Impossible de lire cette photo mobile."));
    image.src = url;
  });
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Impossible de convertir cette photo mobile."))),
      "image/jpeg",
      0.92,
    );
  });
}

/**
 * Safari can select HEIC/HEIF files that are not consistently decoded by the
 * server image libraries. Convert those files in the browser when possible;
 * the server still keeps its own HEIC fallback for browsers that cannot decode
 * the source locally.
 */
export async function normalizeImageFileForUpload(file) {
  if (!file || !isHeicFile(file) || typeof window === "undefined") return file;

  const createObjectUrl = window.URL?.createObjectURL;
  const revokeObjectUrl = window.URL?.revokeObjectURL;
  if (typeof createObjectUrl !== "function") return file;

  let sourceUrl;
  try {
    sourceUrl = createObjectUrl.call(window.URL, file);
    const image = await loadImage(sourceUrl);
    const maxDimension = 2400;
    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);

    const blob = await canvasToBlob(canvas);
    return new File([blob], "mobile-photo.jpg", {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch (conversionError) {
    console.warn("Browser HEIC conversion skipped; server fallback will handle it.", conversionError);
    return file;
  } finally {
    if (sourceUrl && typeof revokeObjectUrl === "function") {
      revokeObjectUrl.call(window.URL, sourceUrl);
    }
  }
}