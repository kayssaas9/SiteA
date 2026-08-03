import { useClerk } from "@clerk/clerk-react";
import { useEffect, useRef, useState } from "react";

export default function SsoCallback() {
  const clerk = useClerk();
  const started = useRef(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const finishOAuth = async () => {
      try {
        await clerk.handleRedirectCallback(
          {
            signInForceRedirectUrl: "/generate",
            signUpForceRedirectUrl: "/generate",
            signInFallbackRedirectUrl: "/generate",
            signUpFallbackRedirectUrl: "/generate",
          },
          async () => {
            window.location.replace("/generate");
          },
        );

        window.location.replace("/generate");
      } catch (err) {
        console.error("Clerk OAuth callback error:", err);
        setError("Impossible de finaliser la connexion. Réessaie.");
      }
    };

    finishOAuth();
  }, [clerk]);

  if (error) {
    return (
      <div className="app-route-loading" role="alert">
        {error}
      </div>
    );
  }

  return (
    <div className="app-route-loading" aria-live="polite">
      Finalisation de la connexion…
    </div>
  );
}
