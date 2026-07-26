import { Link, useLocation } from "react-router-dom";
import { SignedIn, SignedOut, UserButton, useUser } from "@clerk/clerk-react";
import { useState, useEffect } from "react";
import { useUserData } from "../hooks/useUserData.js";
import { useSnapRougeAccess } from "../hooks/useSnapRougeAccess.js";
import "./Header.css";

function CreditsBadge() {
  const { credits, loading } = useUserData();
  if (loading) return <span className="credits-badge skeleton" />;
  return (
    <Link to="/pricing" className="credits-badge" title="Voir les crédits">
      <span className="credits-count">{credits.toLocaleString("fr-FR")}</span>
      <span className="credits-label">crédits</span>
    </Link>
  );
}

export default function Header() {
  const { isSignedIn } = useUser();
  const { pathname } = useLocation();
  const { hasAccess: snapRougeAccess } = useSnapRougeAccess();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const userButtonAppearance = {
  layout: {
    logoPlacement: "none",
  },
};

const navLink = (to, label, className = "") => (
    <Link
      to={to}
      className={`nav-link ${className} ${pathname === to ? "active" : ""}`}
      onClick={() => setMenuOpen(false)}
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

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="logo">
          <span className="logo-dot" />
          <span className="logo-text">Vysion</span>
        </Link>

        <nav className="nav-center">
          {navLink("/generate", "Générer")}
          {navLink("/pricing", "Tarifs")}
          {navLink("/snaprouge", "SnapRouge", "snaprouge-nav-link")}
          {isSignedIn && navLink("/history", "Historique")}
          {isSignedIn && navLink("/account", "Compte")}
        </nav>

        <div className="nav-right">
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
            <UserButton afterSignOutUrl="/" appearance={userButtonAppearance} />
          </SignedIn>

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
          {navItems.map((item) => (
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
            </SignedIn>
          </div>
        </div>
      </div>
    </header>
  );
}
