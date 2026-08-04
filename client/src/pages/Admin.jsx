import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";
import { isAdminUser } from "../lib/admin.js";
import "./Admin.css";

function StatCard({ label, value, detail }) {
  const formattedValue = typeof value === "number"
    ? value.toLocaleString("fr-FR")
    : value;

  return (
    <article className="admin-stat-card">
      <span>{label}</span>
      <strong>{formattedValue}</strong>
      {detail && <small>{detail}</small>}
    </article>
  );
}

export default function Admin() {
  const { user } = useUser();
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    fetch("/api/admin", { cache: "no-store", headers: { "Cache-Control": "no-cache" } })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || "Accès refusé.");
        return body;
      })
      .then((data) => {
        if (!cancelled) setDashboard(data);
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError.message);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!isAdminUser(user)) {
    return <Navigate to="/generate" replace />;
  }

  if (error) {
    return (
      <main className="admin-page page">
        <div className="admin-error card">
          <span className="badge">Accès admin</span>
          <h1>Impossible de charger le menu admin</h1>
          <p>{error}</p>
        </div>
      </main>
    );
  }

  if (!dashboard) {
    return (
      <main className="admin-page page">
        <div className="admin-loading card" aria-live="polite">Chargement du tableau de bord…</div>
      </main>
    );
  }

  const { stats, users, recentGenerations } = dashboard;

  return (
    <main className="admin-page page">
      <header className="admin-page-header">
        <div>
          <span className="badge badge-blue">Espace privé</span>
          <h1 className="page-title">Menu admin</h1>
          <p>Vue d’ensemble de l’activité Astra et des comptes utilisateurs.</p>
        </div>
        <span className="admin-secure-label">Accès vérifié par Clerk</span>
      </header>

      <section className="admin-stats" aria-label="Statistiques générales">
        <StatCard label="Utilisateurs" value={stats.users} />
        <StatCard label="Abonnés en abonnement" value={stats.subscribers} detail="basic, pro ou expert" />
        <StatCard label="Générations" value={stats.generations} detail={`${stats.completedGenerations} terminées`} />
        <StatCard label="En cours" value={stats.processingGenerations} detail="processing ou finalizing" />
        <StatCard label="Taux de finalisation" value={stats.generations ? `${Math.round((stats.completedGenerations / stats.generations) * 100)}%` : "0%"} />
      </section>

      <section className="admin-grid">
        <article className="admin-panel card">
          <div className="admin-panel-heading">
            <div>
              <span className="admin-kicker">Comptes</span>
              <h2>Utilisateurs</h2>
            </div>
            <span className="admin-count">{users.length}</span>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Email</th><th>Plan</th><th>Crédits</th><th>Enquête</th></tr>
              </thead>
              <tbody>
                {users.map((item) => (
                  <tr key={item.clerk_user_id}>
                    <td>{item.email || "—"}</td>
                    <td><span className="admin-plan">{item.plan || "free"}</span></td>
                    <td>{(item.credits ?? 0).toLocaleString("fr-FR")}</td>
                    <td>{item.survey_completed ? "Terminée" : "À faire"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="admin-panel card">
          <div className="admin-panel-heading">
            <div>
              <span className="admin-kicker">Activité récente</span>
              <h2>Dernières générations</h2>
            </div>
            <span className="admin-count">{recentGenerations.length}</span>
          </div>
          <div className="admin-activity-list">
            {recentGenerations.map((item) => (
              <div className="admin-activity-row" key={item.id}>
                <div>
                  <strong>{item.mode || "Génération"}</strong>
                  <p>{item.prompt || "Sans prompt"}</p>
                </div>
                <span className={`admin-status admin-status-${item.status || "completed"}`}>
                  {item.status || "completed"}
                </span>
              </div>
            ))}
            {!recentGenerations.length && <p className="admin-empty">Aucune génération enregistrée.</p>}
          </div>
        </article>
      </section>
    </main>
  );
}