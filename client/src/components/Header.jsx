import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/clerk-react";
import "./Header.css";

export default function Header() {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="logo">
          <span className="logo-icon">🍌</span>
          <span className="logo-text">nano-banana</span>
        </div>
        <nav className="nav">
          <a href="#" className="nav-link">Gallery</a>
          <a href="#" className="nav-link">Pricing</a>

          {/* ── Not signed in ── */}
          <SignedOut>
            <SignInButton mode="modal">
              <button className="nav-btn-outline">Se connecter</button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="nav-btn">Créer un compte</button>
            </SignUpButton>
          </SignedOut>

          {/* ── Signed in ── */}
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </nav>
      </div>
    </header>
  );
}
