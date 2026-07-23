import { Link, useLocation } from "react-router-dom";
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton, useUser } from "@clerk/clerk-react";
import { useState, useEffect } from "react";
import { useUserData } from "../hooks/useUserData.js";
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
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const navLink = (to, label) => (
    <Link
      to={to}
      className={`nav-link ${pathname === to ? "active" : ""}`}
      onClick={() => setMenuOpen(false)}
    >
      {label}
    </Link>
  );

  const navItems = [
    { to: "/generate", label: "Générer" },
    { to: "/pricing", label: "Tarifs" },
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
          {isSignedIn && navLink("/history", "Historique")}
          {isSignedIn && navLink("/account", "Compte")}
        </nav>

        <div className="nav-right">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="btn btn-outline header-btn">Connexion</button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="btn btn-primary header-btn">Créer un compte</button>
            </SignUpButton>
          </SignedOut>

          <SignedIn>
            <CreditsBadge />
            <UserButton afterSignOutUrl="/" />
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
              className={`mobile-nav-link ${pathname === item.to ? "active" : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}

          <div className="mobile-menu-actions">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="btn btn-outline mobile-menu-btn">Connexion</button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="btn btn-primary mobile-menu-btn">Créer un compte</button>
              </SignUpButton>
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
