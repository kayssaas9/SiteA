import { useRef, useState } from "react";
import { useSignIn, useUser } from "@clerk/clerk-react";
import { Link, Navigate, useLocation } from "react-router-dom";
import AuthNav from "../components/AuthNav.jsx";
import { getClerkLoadMessage, useClerkLoadState } from "../hooks/useClerkLoadState.js";
import "./SignIn.css";

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

export default function SignIn() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const { isSignedIn } = useUser();
  const location = useLocation();
  const from = location.state?.from || "/generate";

  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const resetEmailRef = useRef(null);
  const codeRef = useRef(null);
  const newPasswordRef = useRef(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetMode, setResetMode] = useState(false);
  const [resetStep, setResetStep] = useState("email"); // email | password
  const [resetSent, setResetSent] = useState(false);
  const clerkLoadError = useClerkLoadState(isLoaded);

  if (isSignedIn) return <Navigate to={from} replace />;
  if (!isLoaded) {
    return (
      <div className="auth-page">
        <AuthNav />
        <div className="auth-blob blob-top-left" />
        <div className="auth-blob blob-bottom-right" />
        <div className="auth-container">
          <div className="auth-box auth-loading-box">
            {clerkLoadError ? <div className="auth-error-icon" aria-hidden="true">!</div> : <div className="spinner" />}
            <h1 className="auth-title">Connexion</h1>
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
    setLoading(true);
    setError("");

    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: `${window.location.origin}/sso-callback`,
        redirectUrlComplete: `${window.location.origin}${from}`,
      });
    } catch (err) {
      setError(err.errors?.[0]?.message || err.message || "Impossible d’ouvrir Google. Réessaie.");
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn.create({
        identifier: emailRef.current?.value || "",
        password: passwordRef.current?.value || "",
      });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
      } else {
        setError("Impossible de se connecter. Vérifiez vos identifiants.");
      }
    } catch (err) {
      setError(err.errors?.[0]?.message || "Erreur de connexion.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: resetEmailRef.current?.value || "",
      });
      setEmail(resetEmailRef.current?.value || "");
      setResetSent(true);
      setResetStep("password");
    } catch (err) {
      setError(err.errors?.[0]?.message || "Erreur lors de l'envoi du code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn.resetPassword({
        password: newPasswordRef.current?.value || "",
        code: codeRef.current?.value || "",
      });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
      } else {
        setError("Impossible de réinitialiser le mot de passe.");
      }
    } catch (err) {
      setError(err.errors?.[0]?.message || "Code incorrect ou mot de passe invalide.");
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
        {resetMode ? (
          <div className="auth-box fade-up">
            <h1 className="auth-title">Réinitialiser le mot de passe</h1>
            <p className="auth-subtitle">
              {resetStep === "email"
                ? "Saisis ton email pour recevoir un code de réinitialisation."
                : "Saisis le code reçu et ton nouveau mot de passe."}
            </p>

            {resetStep === "email" ? (
              <form onSubmit={handleResetRequest} className="auth-form">
                <div className="auth-field">
                  <label htmlFor="reset-email">Email</label>
                  <input
                    id="reset-email"
                    type="email"
                    ref={resetEmailRef}
                    placeholder="exemple@email.com"
                    required
                    disabled={loading}
                  />
                </div>
                {error && <p className="auth-error">{error}</p>}
                <button type="submit" className="auth-btn" disabled={loading}>
                  {loading ? "Envoi…" : "Envoyer le code"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="auth-form">
                <div className="auth-field">
                  <label htmlFor="reset-code">Code de vérification</label>
                  <input
                    id="reset-code"
                    type="text"
                    inputMode="numeric"
                    ref={codeRef}
                    placeholder="123456"
                    required
                    disabled={loading}
                  />
                </div>
                <div className="auth-field">
                  <label htmlFor="reset-password">Nouveau mot de passe</label>
                  <input
                    id="reset-password"
                    type="password"
                    ref={newPasswordRef}
                    placeholder="••••••••"
                    required
                    disabled={loading}
                  />
                </div>
                {resetSent && (
                  <p className="auth-success">Un code a été envoyé à {email}.</p>
                )}
                {error && <p className="auth-error">{error}</p>}
                <button type="submit" className="auth-btn" disabled={loading}>
                  {loading ? "Réinitialisation…" : "Réinitialiser"}
                </button>
              </form>
            )}

            <p className="auth-footer">
              <button className="auth-text-link" onClick={() => setResetMode(false)}>
                Retour à la connexion
              </button>
            </p>
          </div>
        ) : (
          <div className="auth-box fade-up">
            <h1 className="auth-title">Bon retour</h1>
            <p className="auth-subtitle">Connecte-toi pour accéder à tes crédits et générer des images.</p>

            <button type="button" className="auth-social-btn" onClick={handleGoogle} disabled={loading}>
              <GoogleIcon />
              {loading ? "Connexion à Google…" : "Continuer avec Google"}
            </button>

            <div className="auth-divider">
              <span>ou continue avec ton email</span>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                    ref={emailRef}
                  placeholder="exemple@email.com"
                  required
                  disabled={loading}
                />
              </div>

              <div className="auth-field">
                <div className="auth-label-row">
                  <label htmlFor="password">Mot de passe</label>
                  <button
                    type="button"
                    className="auth-text-link small"
                    onClick={() => setResetMode(true)}
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
                <input
                  id="password"
                  type="password"
                  ref={passwordRef}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
              </div>

              {error && <p className="auth-error">{error}</p>}

              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? "Connexion…" : "Se connecter"}
              </button>
            </form>

            <p className="auth-footer">
              Pas encore de compte ?{" "}
              <Link to="/sign-up" className="auth-text-link">
                Créer un compte
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
