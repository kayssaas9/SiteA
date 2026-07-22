import { Link, useLocation } from "react-router-dom";
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton, useUser } from "@clerk/clerk-react";
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

  const navLink = (to, label) => (
    <Link
      to={to}
      className={`nav-link ${pathname === to ? "active" : ""}`}
    >
      {label}
    </Link>
  );

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
        </div>
      </div>
    </header>
  );
}
