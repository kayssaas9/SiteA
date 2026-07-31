import { useEffect, useState } from "react";

function isClerkLoadError(value) {
  const message = typeof value === "string"
    ? value
    : value?.message || value?.reason?.message || "";

  return /failed_to_load_clerk|failed to load clerk|clerk\.js/i.test(message);
}

export function useClerkLoadState(isLoaded) {
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      setLoadError(false);
      return undefined;
    }

    const timeout = window.setTimeout(() => setLoadError(true), 5000);
    const handleRejection = (event) => {
      if (isClerkLoadError(event.reason)) {
        setLoadError(true);
      }
    };
    const handleError = (event) => {
      if (isClerkLoadError(event.error || event.message)) {
        setLoadError(true);
      }
    };

    window.addEventListener("unhandledrejection", handleRejection);
    window.addEventListener("error", handleError);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("unhandledrejection", handleRejection);
      window.removeEventListener("error", handleError);
    };
  }, [isLoaded]);

  return loadError;
}

export function getClerkLoadMessage() {
  const hostname = window.location.hostname;

  if (hostname.endsWith(".replit.dev")) {
    return "L’aperçu Replit utilise une clé Clerk de production et ne peut pas charger l’authentification. Ouvre le site publié après avoir corrigé son domaine.";
  }

  return "Le service d’authentification est indisponible. Le domaine Clerk de production doit être reconnecté à ton domaine DNS.";
}