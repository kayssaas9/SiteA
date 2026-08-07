import { Link, useLocation } from "react-router-dom";
import { SignedIn, SignedOut, useUser } from "@clerk/clerk-react";
import { useState, useEffect, useRef } from "react";
import { useUserData } from "../hooks/useUserData.js";
import { useSnapRougeAccess } from "../hooks/useSnapRougeAccess.js";
import { isAdminUser } from "../lib/admin.js";
import BrandLogo from "./BrandLogo.jsx";
import "./Header.css";

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English", flagClass: "flag-us", shortLabel: "EN" },
  { value: "fr", label: "French", flagClass: "flag-fr", shortLabel: "FR" },
  { value: "es", label: "Spanish", flagClass: "flag-es", shortLabel: "ES" },
];

function LanguageDropdown({ language, onChange, mobile = false }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const selectedLanguage = LANGUAGE_OPTIONS.find((option) => option.value === language) ?? LANGUAGE_OPTIONS[1];

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (!dropdownRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={dropdownRef}
      className={`app-language-dropdown ${mobile ? "app-mobile-language-dropdown" : ""}`}
    >
      <button
        type="button"
        className="app-language-trigger"
        onClick={() => setOpen((isOpen) => !isOpen)}
        aria-label="Choisir la langue"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span
          className={`language-flag ${selectedLanguage.flagClass}`}
          aria-hidden="true"
        />
        <span className="app-language-short">{selectedLanguage.shortLabel}</span>
        <span className={`app-language-chevron ${open ? "is-open" : ""}`} aria-hidden="true" />
      </button>

      {open && (
        <div className="app-language-options" role="listbox" aria-label="Langues disponibles">
          {LANGUAGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`app-language-option ${option.value === language ? "is-selected" : ""}`}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              role="option"
              aria-selected={option.value === language}
            >
              <span
                className={`language-flag app-language-option-flag ${option.flagClass}`}
                aria-hidden="true"
              />
              <span className="app-language-option-label">{option.label}</span>
              {option.value === language && <span className="app-language-check" aria-hidden="true">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const { isSignedIn, user } = useUser();
  const { pathname } = useLocation();
  const { hasAccess: snapRougeAccess } = useSnapRougeAccess();
  const { plan, credits, surveyCompleted, loading: userDataLoading, refetch: refetchUserData } = useUserData();
  const isSubscriber = ["basic", "pro", "expert"].includes(plan);
  const historyPath = !userDataLoading && (!isSubscriber || (plan !== "expert" && credits <= 0))
    ? "/pricing"
    : "/history";
  const isAdmin = isAdminUser(user);
  const [menuOpen, setMenuOpen] = useState(false);
  const [landingScrolled, setLandingScrolled] = useState(false);
  const [language, setLanguage] = useState("fr");
  const isLanding = pathname === "/";

  useEffect(() => {
    setMenuOpen(false);
    if (!isLanding) setLandingScrolled(false);
  }, [pathname, isLanding]);

  useEffect(() => {
    const storedLanguage = window.localStorage.getItem("astracrea-language");
    if (storedLanguage && ["fr", "en", "es"].includes(storedLanguage)) {
      setLanguage(storedLanguage);
      document.documentElement.lang = storedLanguage;
    }
  }, []);

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
    ...(isSignedIn ? [{ to: historyPath, label: "Historique" }] : []),
    ...(isSignedIn ? [{ to: "/account", label: "Compte" }] : []),
    ...(isAdmin ? [{ to: "/admin", label: "Admin", className: "admin-nav-link" }] : []),
  ];

  const landingNavItems = [
    { to: "#avis", label: "Comment ça marche ?" },
    { to: "#exemples", label: "Fonctionnalités" },
    { to: "#exemples", label: "Résultats" },
    { to: "/pricing", label: "Tarifs" },
    { to: "#faq", label: "FAQ" },
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

  const handleLanguageChange = (event) => {
    const nextLanguage = typeof event === "string" ? event : event.target.value;
    setLanguage(nextLanguage);
    window.localStorage.setItem("astracrea-language", nextLanguage);
    document.documentElement.lang = nextLanguage;
  };

  return (
    <header
      className={`header ${isLanding ? "header-landing" : "header-app"} ${landingScrolled ? "is-scrolled" : ""}`}
    >
      <div className="header-inner">
        <Link to="/" className="logo">
          <BrandLogo
            name={isLanding ? "stracrea" : "Astracrea"}
            className={isLanding ? "brand-logo-landing-complete" : ""}
          />
        </Link>

        <nav className="nav-center">
          {isLanding ? (
            <>
              {landingNavLink("#avis", "Comment ça marche ?")}
              {landingNavLink("#exemples", "Fonctionnalités")}
              {landingNavLink("#exemples", "Résultats")}
              {landingNavLink("/pricing", "Tarifs")}
              {landingNavLink("#faq", "FAQ")}
            </>
          ) : (
            <>
              {navLink("/generate", "Générer")}
              {navLink("/pricing", "Tarifs")}
              {navLink("/snaprouge", "SnapRouge", "snaprouge-nav-link")}
              {isSignedIn && navLink(historyPath, "Historique")}
              {isSignedIn && navLink("/account", "Compte")}
              {isAdmin && navLink("/admin", "Admin", "admin-nav-link")}
            </>
          )}
        </nav>

        <div className="nav-right">
          {isLanding ? (
            <>
              <label className="desktop-language-picker">
                <span className="desktop-language-icon" aria-hidden="true">文A</span>
                <span className="sr-only">Choisir la langue</span>
                <select value={language} onChange={handleLanguageChange} aria-label="Choisir la langue">
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                </select>
              </label>
              {isSignedIn ? (
                <Link to="/generate" className="btn btn-primary header-btn landing-app-btn">
                  Accéder à l’app
                </Link>
              ) : (
                <>
                  <Link to="/sign-in" className="btn btn-outline header-btn">
                    Se connecter
                  </Link>
                  <Link to="/sign-up" className="btn btn-primary header-btn">
                    S’inscrire
                  </Link>
                </>
              )}
            </>
          ) : (
            <>
              {isSignedIn && (
                <>
                  <Link to="/pricing" className="header-upgrade-btn">
                    Upgrade
                  </Link>
                  <LanguageDropdown language={language} onChange={handleLanguageChange} />
                </>
              )}
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
                  key={`${item.to}-${item.label}`}
                  href={item.to}
                  className="mobile-nav-link"
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))
            : navItems.map((item) => (
                <Link
                  key={`${item.to}-${item.label}`}
                  to={item.to}
                  className={`mobile-nav-link ${item.className ?? ""} ${pathname === item.to ? "active" : ""}`}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}

          {isLanding && (
            <label className="mobile-language-picker">
              <span className="mobile-language-icon" aria-hidden="true">文A</span>
              <span className="sr-only">Choisir la langue</span>
              <select value={language} onChange={handleLanguageChange} aria-label="Choisir la langue">
                <option value="fr">Français</option>
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </label>
          )}

          {!isLanding && (
            <LanguageDropdown language={language} onChange={handleLanguageChange} mobile />
          )}

          <div className={`mobile-menu-actions ${isLanding ? "landing-mobile-actions" : ""}`}>
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
                {isSignedIn && (
                  <Link to="/pricing" className="btn btn-primary mobile-menu-btn mobile-upgrade-btn">
                    Upgrade
                  </Link>
                )}
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
