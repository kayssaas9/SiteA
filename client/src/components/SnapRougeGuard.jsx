import { Navigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { useSnapRougeAccess } from "../hooks/useSnapRougeAccess.js";
import SnapRougeAccess from "./SnapRougeAccess.jsx";
import "./SnapRougeGuard.css";

/**
 * Wraps a route that requires SnapRouge access.
 * Access is granted if the user has an active Pro/Expert plan OR if they
 * bought the SnapRouge one-time unlock.
 *
 * Logged-in users without access see the SnapRouge unlock page.
 * Anonymous users are redirected to the pricing page with the unlock banner.
 */
export default function SnapRougeGuard({ children }) {
  const { user } = useUser();
  const { hasAccess, loading } = useSnapRougeAccess();
  const [ready, setReady] = useState(false);

  // Wait for the first access check to complete before deciding to render.
  // This prevents flashing the paywall on the very first render while user data
  // is still loading (useSnapRougeAccess starts with hasAccess=false).
  useEffect(() => {
    if (!loading) setReady(true);
  }, [loading]);

  if (loading || !ready) {
    return (
      <div className="snaprouge-loading">
        <div className="spinner" />
        <p>Vérification de l'accès SnapRouge…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/pricing?unlock=snaprouge" replace />;
  }

  if (!hasAccess) {
    return <SnapRougeAccess />;
  }

  return children;
}
