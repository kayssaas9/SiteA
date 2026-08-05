import { Link, useLocation } from "react-router-dom";
import { SignedIn, SignedOut, useClerk, useUser } from "@clerk/clerk-react";
import { useState, useEffect } from "react";
import { useUserData } from "../hooks/useUserData.js";
import { useSnapRougeAccess } from "../hooks/useSnapRougeAccess.js";
import { isAdminUser } from "../lib/admin.js";
import BrandLogo from "./BrandLogo.jsx";
import "./Header.css";

export default function Header() {
  const { isSignedIn, user } = useUser();
  const { pathname } = useLocation();
  const { hasAccess: snapRougeAccess } = useSnapRougeAccess();
  const { plan, surveyCompleted, loading: userDataLoading, refetch: refetchUserData } = useUserData();
  const isSubscriber = ["basic", "pro", "expert"].includes(plan);
  const isAdmin = isAdminUser(user);
  const [menuOpen, setMenuOpen] = useState(false);
  const [landingScrolled, setLandingScrolled] = useState(false);
  const isLanding = pathname === "/";

  useEffect(() => {
    setMenuOpen(false);
    if (!isLanding) setLandingScrolled(false);
  }, [pathname, isLanding]);

  useEffect(() => {
    if (!isLanding) return undefined;
    const handleScroll = () => setLandingScrolled(window.scrollY > 72);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isLanding]);

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
    ...(isAdmin ? [{ to: "/admin", label: "Admin", className: "admin-nav-link" }] : []),
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
    <header
      className={`header ${isLanding ? "header-landing" : "header-app"} ${landingScrolled ? "is-scrolled" : ""}`}
    >
      <div className="header-inner">
        <Link to="/" className="logo">
          <BrandLogo />
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
              {isAdmin && navLink("/admin", "Admin", "admin-nav-link")}
            </>
          )}
        </nav>

        <div className="nav-right">
          {isLanding ? (
            isSignedIn ? (
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
                <Link to="/sign-in" className="btn btn-outline header-btn">
                  Se connecter
                </Link>
                <Link to="/sign-up" className="btn btn-primary header-btn">
                  S’inscrire
                </Link>
              </>
            )
          ) : (
            <>
              {isSignedIn && !userDataLoading && isSubscriber && !surveyCompleted && (
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
              isSignedIn ? (
                <>
                  <Link to="/generate" className="btn btn-primary mobile-menu-btn">
                    Accéder à l’app
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/sign-in" className="btn btn-outline mobile-menu-btn">
                    Se connecter
                  </Link>
                  <Link to="/sign-up" className="btn btn-primary mobile-menu-btn">
                    S’inscrire
                  </Link>
                </>
              )
            ) : (
              <>
                {isSignedIn && !userDataLoading && isSubscriber && !surveyCompleted && (
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

              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
