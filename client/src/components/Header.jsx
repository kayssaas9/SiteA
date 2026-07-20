import { Link } from "react-router-dom";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
} from "@clerk/clerk-react";
import { useUserData } from "../hooks/useUserData.js";
import "./Header.css";

function CreditsBadge() {
  const { credits, plan, loading } = useUserData();
  if (loading) return <span className="credits-badge skeleton" />;
  return (
    <Link to="/pricing" className="credits-badge" title="Voir les offres">
      <span className="credits-icon">⚡</span>
      <span className="credits-count">{credits.toLocaleString("fr-FR")}</span>
      {plan !== "free" && <span className="credits-plan">{plan}</span>}
    </Link>
  );
}

function SnapRougeLink() {
  const { snaprougeUnlocked, loading } = useUserData();
  if (loading || !snaprougeUnlocked) return null;
  return (
    <Link to="/snaprouge" className="nav-link snaprouge-link">
      🔴 SnapRouge
    </Link>
  );
}

export default function Header() {
  const { isSignedIn } = useUser();

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="logo">
          <span className="logo-icon">🍌</span>
          <span className="logo-text">nano-banana</span>
        </Link>

        <nav className="nav">
          <Link to="/pricing" className="nav-link">Tarifs</Link>
          <SnapRougeLink />

          <SignedOut>
            <SignInButton mode="modal">
              <button className="nav-btn-outline">Se connecter</button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="nav-btn">Créer un compte</button>
            </SignUpButton>
          </SignedOut>

          <SignedIn>
            <CreditsBadge />
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </nav>
      </div>
    </header>
  );
}
