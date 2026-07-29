import { Link, useLocation } from "react-router-dom";
import { SignedIn, SignedOut, useClerk, useUser } from "@clerk/clerk-react";
import { useState, useEffect } from "react";
import { useUserData } from "../hooks/useUserData.js";
import { useSnapRougeAccess } from "../hooks/useSnapRougeAccess.js";
import "./Header.css";

function CreditsBadge() {
  const { plan, credits, loading } = useUserData();
  if (loading) return <span className="credits-badge skeleton" />;
  return (
    <Link to="/pricing" className="credits-badge" title="Voir les crédits">
      <span className="credits-count">{plan === "expert" ? "Illimités" : credits.toLocaleString("fr-FR")}</span>
      <span className="credits-label">crédits</span>
    </Link>
  );
}

export default function Header() {
  const { isSignedIn } = useUser();
  const { pathname } = useLocation();
  const { hasAccess: snapRougeAccess } = useSnapRougeAccess();
  const { surveyCompleted, refetch: refetchUserData } = useUserData();
  const [menuOpen, setMenuOpen] = useState(false);
  const isLanding = pathname === "/";

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleSurveyCompleted = () => refetchUserData();
    window.addEventListener("survey-completed", handleSurveyCompleted);
    return () => window.removeEventListener("survey-completed", handleSurveyCompleted);
  }, [refetchUserData]);

function SignOutButton() {
  const { signOut } = useClerk();
  return (
    <button
      className="btn btn-outline signout-btn"
      onClick={() => signOut({ redirectUrl: "/" })}
      type="button"
    >
      Déconnexion
    </button>
  );
}

const navLink = (to, label, className = "") => (
    <Link
      to={to}
      className={`nav-link ${className} ${pathname === to ? "active" : ""}`}
      onClick={() => {
        setMenuOpen(false);
        if (pathname === to) {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }}
    >
      {label}
    </Link>
  );

  const navItems = [
    { to: "/generate", label: "Générer" },
    { to: "/pricing", label: "Tarifs" },
    { to: "/snaprouge", label: "SnapRouge", className: "snaprouge-nav-link" },
    ...(isSignedIn ? [{ to: "/history", label: "Historique" }] : []),
    ...(isSignedIn ? [{ to: "/account", label: "Compte" }] : []),
  ];

  const landingNavItems = [
    { to: "#avis", label: "Avis" },
    { to: "#faq", label: "FAQ" },
    { to: "#exemples", label: "Fonctionnalités" },
  ];

  const landingNavLink = (to, label) => (
    <a
      href={to}
      className="nav-link"
      onClick={() => setMenuOpen(false)}
    >
      {label}
    </a>
  );

  return (
    <header className={`header ${isLanding ? "header-landing" : "header-app"}`}>
      <div className="header-inner">
        <Link to="/" className="logo">
          <span className="logo-dot" />
          <span className="logo-text">Vysion</span>
        </Link>

        <nav className="nav-center">
          {isLanding ? (
            <>
              {landingNavLink("#avis", "Avis")}
              {landingNavLink("#faq", "FAQ")}
              {landingNavLink("#exemples", "Fonctionnalités")}
            </>
          ) : (
            <>
              {navLink("/generate", "Générer")}
              {navLink("/pricing", "Tarifs")}
              {navLink("/snaprouge", "SnapRouge", "snaprouge-nav-link")}
              {isSignedIn && navLink("/history", "Historique")}
              {isSignedIn && navLink("/account", "Compte")}
            </>
          )}
        </nav>

        <div className="nav-right">
          {isLanding ? (
            <>
              <Link to="/generate" className="btn btn-primary header-btn landing-app-btn">
                Accéder à l’app
              </Link>
              <SignedIn>
                <SignOutButton />
              </SignedIn>
            </>
          ) : (
            <>
              {(!isSignedIn || !surveyCompleted) && (
                <Link to="/survey" className="btn btn-outline header-btn survey-nav-btn">
                  Gagne 400 crédits
                </Link>
              )}
              <SignedOut>
                <Link to="/sign-in" className="btn btn-outline header-btn">
                  Connexion
                </Link>
                <Link to="/sign-up" className="btn btn-primary header-btn">
                  Créer un compte
                </Link>
              </SignedOut>

              <SignedIn>
                <CreditsBadge />
                <SignOutButton />
              </SignedIn>
            </>
          )}

          <button
            className={`mobile-menu-toggle ${menuOpen ? "open" : ""}`}
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={menuOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      <div className={`mobile-menu ${menuOpen ? "open" : ""}`}>
        <div className="mobile-menu-inner">
          {isLanding
            ? landingNavItems.map((item) => (
                <a
                  key={item.to}
                  href={item.to}
                  className="mobile-nav-link"
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))
            : navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`mobile-nav-link ${item.className ?? ""} ${pathname === item.to ? "active" : ""}`}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}

          <div className="mobile-menu-actions">
            {isLanding ? (
              <>
                <Link to="/generate" className="btn btn-primary mobile-menu-btn">
                  Accéder à l’app
                </Link>
                <SignedIn>
                  <SignOutButton />
                </SignedIn>
              </>
            ) : (
              <>
                {(!isSignedIn || !surveyCompleted) && (
                  <Link to="/survey" className="btn btn-primary mobile-menu-btn survey-mobile-btn">
                    Gagne 400 crédits
                  </Link>
                )}
                <SignedOut>
                  <Link to="/sign-in" className="btn btn-outline mobile-menu-btn">
                    Connexion
                  </Link>
                  <Link to="/sign-up" className="btn btn-primary mobile-menu-btn">
                    Créer un compte
                  </Link>
                </SignedOut>

                <SignedIn>
                  <CreditsBadge />
                  <SignOutButton />
                </SignedIn>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
