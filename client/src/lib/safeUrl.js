export function getSafeUrl(value, { allowDataImage = false } = {}) {
  if (typeof value !== "string" || !value.trim()) return null;

  const candidate = value.trim();
  if (allowDataImage && /^data:image\/[a-z0-9.+-]+;base64,/i.test(candidate)) {
    return candidate;
  }

  // Keep Safari away from URL parsing for image and payment strings. Relative
  // Astra API paths are valid; external redirects must be explicit HTTP(S)
  // URLs without whitespace or control characters.
  if (/^\/(?!\/)[^\s"'<>]*$/.test(candidate)) return candidate;
  if (/^https?:\/\/[^\s"'<>]+$/i.test(candidate)) return candidate;
  return null;
}

export function navigateToSafeUrl(value) {
  const safeUrl = getSafeUrl(value);
  if (!safeUrl) throw new Error("URL de redirection invalide.");
  window.location.assign(safeUrl);
}