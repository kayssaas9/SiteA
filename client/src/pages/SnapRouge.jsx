import { useUserData } from "../hooks/useUserData.js";
import "./SnapRouge.css";

export default function SnapRouge() {
  const { plan } = useUserData();

  return (
    <main className="snaprouge-page">
      <div className="snaprouge-hero">
        <div className="snaprouge-badge">🔒 Accès débloqué</div>
        <h1 className="snaprouge-title">
          SnapRouge <span className="gradient-text">Tech</span>
        </h1>
        <p className="snaprouge-sub">
          Bienvenue dans l'espace technique réservé. Ici, vous trouvez les paramètres avancés,
          les intégrations API et les outils de debug pour nano-banana.
        </p>
      </div>

      <section className="snaprouge-section">
        <h2 className="snaprouge-section-title">Paramètres avancés</h2>
        <div className="snaprouge-grid">
          <div className="snaprouge-card">
            <div className="snaprouge-card-icon">🛠️</div>
            <div className="snaprouge-card-title">API & Webhooks</div>
            <p className="snaprouge-card-text">
              Configuration des endpoints Stripe, Clerk et des secrets d'environnement.
            </p>
          </div>
          <div className="snaprouge-card">
            <div className="snaprouge-card-icon">📊</div>
            <div className="snaprouge-card-title">Métriques</div>
            <p className="snaprouge-card-text">
              Suivi des crédits consommés, des conversions et de l'utilisation des modèles.
            </p>
          </div>
          <div className="snaprouge-card">
            <div className="snaprouge-card-icon">🔐</div>
            <div className="snaprouge-card-title">Sécurité</div>
            <p className="snaprouge-card-text">
              Rotation des clés, audit des accès et logs des événements critiques.
            </p>
          </div>
        </div>
      </section>

      <section className="snaprouge-section">
        <h2 className="snaprouge-section-title">Statut du compte</h2>
        <div className="snaprouge-status">
          <span className="snaprouge-status-label">Plan actuel :</span>
          <span className="snaprouge-status-value">{plan || "free"}</span>
        </div>
        <div className="snaprouge-status">
          <span className="snaprouge-status-label">Accès SnapRouge :</span>
          <span className="snaprouge-status-value unlocked">débloqué</span>
        </div>
      </section>
    </main>
  );
}
