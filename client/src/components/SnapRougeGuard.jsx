import { Navigate } from "react-router-dom";
import { useUserData } from "../hooks/useUserData.js";
import "./SnapRougeGuard.css";

/**
 * Wraps a route that requires SnapRouge access.
 * Access is granted if the user has an active Pro/Expert plan OR if they
 * bought the SnapRouge one-time unlock.
 */
export default function SnapRougeGuard({ children }) {
  const { plan, snaprougeUnlocked, loading } = useUserData();
  const hasAccess = plan === "pro" || plan === "expert" || snaprougeUnlocked;

  if (loading) {
    return (
      <div className="snaprouge-loading">
        <div className="spinner" />
        <p>Vérification de l'accès SnapRouge…</p>
      </div>
    );
  }

  if (!hasAccess) {
    return <Navigate to="/pricing?unlock=snaprouge" replace />;
  }

  return children;
}
