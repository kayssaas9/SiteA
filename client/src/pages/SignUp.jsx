import { useState } from "react";
import { useSignUp, useUser } from "@clerk/clerk-react";
import { Link, Navigate } from "react-router-dom";
import AuthNav from "../components/AuthNav.jsx";
import { getClerkLoadMessage, useClerkLoadState } from "../hooks/useClerkLoadState.js";
import "./SignUp.css";

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

export default function SignUp() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const { isSignedIn } = useUser();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verificationStep, setVerificationStep] = useState(false);
  const clerkLoadError = useClerkLoadState(isLoaded);

  if (isSignedIn) return <Navigate to="/generate" replace />;
  if (!isLoaded) {
    return (
      <div className="auth-page">
        <AuthNav />
        <div className="auth-blob blob-top-left" />
        <div className="auth-blob blob-bottom-right" />
        <div className="auth-container">
          <div className="auth-box auth-loading-box">
            {clerkLoadError ? <div className="auth-error-icon" aria-hidden="true">!</div> : <div className="spinner" />}
            <h1 className="auth-title">Créer un compte</h1>
            <p className={`auth-subtitle${clerkLoadError ? " auth-load-error-message" : ""}`} role={clerkLoadError ? "alert" : undefined}>
              {clerkLoadError ? getClerkLoadMessage() : "Préparation de ton espace sécurisé…"}
            </p>
            {clerkLoadError && (
              <button className="auth-btn auth-retry-btn" type="button" onClick={() => window.location.reload()}>
                Réessayer
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const handleGoogle = async () => {
    await signUp.authenticateWithRedirect({
      strategy: "oauth_google",
      redirectUrl: "/sso-callback",
      redirectUrlComplete: "/generate",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signUp.create({
        emailAddress: email,
        password,
      });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
      } else if (result.status === "missing_requirements") {
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
        setVerificationStep(true);
      } else {
        setError("Erreur lors de l'inscription.");
      }
    } catch (err) {
      setError(err.errors?.[0]?.message || "Erreur lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
      } else {
        setError("Code incorrect. Vérifie et réessaie.");
      }
    } catch (err) {
      setError(err.errors?.[0]?.message || "Code incorrect.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <AuthNav />
      <div className="auth-blob blob-top-left" />
      <div className="auth-blob blob-bottom-right" />

      <div className="auth-container">
        <div className="auth-box fade-up">
          {verificationStep ? (
            <>
              <h1 className="auth-title">Vérifie ton email</h1>
              <p className="auth-subtitle">
                Un code de vérification a été envoyé à {email}. Saisis-le ci-dessous pour finaliser ton inscription.
              </p>

              <form onSubmit={handleVerify} className="auth-form">
                <div className="auth-field">
                  <label htmlFor="code">Code de vérification</label>
                  <input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="123456"
                    required
                    disabled={loading}
                  />
                </div>
                {error && <p className="auth-error">{error}</p>}
                <button type="submit" className="auth-btn" disabled={loading}>
                  {loading ? "Vérification…" : "Vérifier et continuer"}
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="auth-title">Créer un compte</h1>
              <p className="auth-subtitle">Rejoins Astra et génère des images IA en quelques secondes.</p>

              <button className="auth-social-btn" onClick={handleGoogle} disabled={loading}>
                <GoogleIcon />
                Continuer avec Google
              </button>

              <div className="auth-divider">
                <span>ou continue avec ton email</span>
              </div>

              <form onSubmit={handleSubmit} className="auth-form">
                <div className="auth-field">
                  <label htmlFor="signup-email">Email</label>
                  <input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="exemple@email.com"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="auth-field">
                  <label htmlFor="signup-password">Mot de passe</label>
                  <input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={loading}
                  />
                </div>

                {error && <p className="auth-error">{error}</p>}

                <button type="submit" className="auth-btn" disabled={loading}>
                  {loading ? "Inscription…" : "S'inscrire"}
                </button>
              </form>
            </>
          )}

          <p className="auth-footer">
            Déjà un compte ?{" "}
            <Link to="/sign-in" className="auth-text-link">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
