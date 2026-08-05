import { Link } from "react-router-dom";
import "./AuthNav.css";

export default function AuthNav() {
  return (
    <nav className="auth-nav">
      <Link to="/" className="logo">
        <span className="logo-dot" />
        <span className="logo-text">Astracrea</span>
      </Link>
    </nav>
  );
}
