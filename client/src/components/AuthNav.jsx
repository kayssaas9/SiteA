import { Link } from "react-router-dom";
import BrandLogo from "./BrandLogo.jsx";
import "./AuthNav.css";

export default function AuthNav() {
  return (
    <nav className="auth-nav">
      <Link to="/" className="logo">
        <BrandLogo name="stracrea" />
      </Link>
    </nav>
  );
}
