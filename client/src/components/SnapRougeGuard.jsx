import { Navigate } from "react-router-dom";
import { useUserData } from "../hooks/useUserData.js";

/**
 * Wraps a route that requires SnapRouge access.
 * Redirects to /pricing if the user hasn't unlocked it.
 */
export default function SnapRougeGuard({ children }) {
  const { snaprougeUnlocked, loading } = useUserData();

  if (loading) {
    return (
      <div className="snaprouge-loading">
        <div className="spinner" />
        <p>Vérification de l'accès SnapRouge…</p>
      </div>
    );
  }

  if (!snaprougeUnlocked) {
    return <Navigate to="/pricing?unlock=snaprouge" replace />;
  }

  return children;
}
