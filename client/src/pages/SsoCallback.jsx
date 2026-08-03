import { useClerk } from "@clerk/clerk-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SsoCallback() {
  const clerk = useClerk();
  const navigate = useNavigate();
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
            navigate("/generate", { replace: true });
          },
        );

        navigate("/generate", { replace: true });
      } catch (err) {
        console.error("Clerk OAuth callback error:", err);
        setError("Impossible de finaliser la connexion. Réessaie.");
      }
    };

    finishOAuth();
  }, [clerk, navigate]);

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
