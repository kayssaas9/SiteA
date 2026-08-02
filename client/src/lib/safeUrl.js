export function getSafeUrl(value, { allowDataImage = false } = {}) {
  if (typeof value !== "string" || !value.trim()) return null;

  const candidate = value.trim();
  if (allowDataImage && /^data:image\/[a-z0-9.+-]+;base64,/i.test(candidate)) {
    return candidate;
  }

  try {
    const parsed = new URL(candidate, window.location.origin);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.href;
  } catch {
    return null;
  }
}

export function navigateToSafeUrl(value) {
  const safeUrl = getSafeUrl(value);
  if (!safeUrl) throw new Error("URL de redirection invalide.");
  window.location.assign(safeUrl);
}