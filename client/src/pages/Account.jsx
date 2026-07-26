import { useUser, SignOutButton } from "@clerk/clerk-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useUserData } from "../hooks/useUserData.js";
import { useSnapRougeAccess } from "../hooks/useSnapRougeAccess.js";
import "./Account.css";

const PLAN_LABELS = {
  free: "Gratuit",
  basic: "Basique",
  pro: "Pro",
  expert: "Expert",
};

export default function Account() {
  const { user } = useUser();
  const { plan, credits, surveyCompleted, refetch } = useUserData();
  const { hasAccess: snapRougeAccess, loading: snapRougeLoading } = useSnapRougeAccess();
  const navigate = useNavigate();
  const [referral, setReferral] = useState({ code: "", count: 0, earned: 0, loading: true });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/referral/${user.id}`)
      .then((r) => r.json())
      .then((data) => setReferral({ code: data.referralCode ?? "", count: data.referralCount ?? 0, earned: data.creditsEarned ?? 0, loading: false }))
      .catch(() => setReferral((s) => ({ ...s, loading: false })));
  }, [user?.id]);

  const copyLink = () => {
    if (!referral.code) return;
    const url = `${window.location.origin}/r/${referral.code}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!user) {
    return (
      <main className="account-page">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="page">
          <p className="account-message fade-up">Connectez-vous pour accéder à votre compte.</p>
        </div>
      </main>
    );
  }

  const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() || user.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() || "?";

  return (
    <main className="account-page">
      <div className="blob blob-1" />
      <div className="blob blob-2" />

      <div className="page account-content">
        <h1 className="page-title fade-up">Votre <span className="accent">compte</span></h1>
        <p className="page-subtitle fade-up delay-1">Gérez votre abonnement, vos crédits et vos accès premium.</p>

        <div className="account-grid fade-up delay-1">
          <div className="profile-card card">
            <div className="profile-avatar">{initials}</div>
            <div className="profile-info">
              <div className="profile-name">
                {user.firstName} {user.lastName}
              </div>
              <div className="profile-email">{user.primaryEmailAddress?.emailAddress}</div>
            </div>
          </div>

          <div className={`plan-card card ${plan === "pro" || plan === "expert" ? "highlight" : ""}`}>
            <div className="plan-card-label">Plan actuel</div>
            <div className="plan-card-value">{PLAN_LABELS[plan] || plan}</div>
            {plan !== "free" && (
              <Link to="/pricing" className="btn btn-outline plan-card-btn">
                Gérer l'abonnement
              </Link>
            )}
          </div>

          <div className="credits-card card">
            <div className="credits-card-label">Crédits restants</div>
            <div className="credits-card-value">{plan === "expert" ? "Illimités" : credits.toLocaleString("fr-FR")}</div>
            <Link to="/pricing" className="btn btn-outline plan-card-btn">
              Recharger
            </Link>
          </div>
        </div>

        <div className="account-actions card fade-up delay-2">
          <h2 className="account-section-title">Options</h2>
          <Link to="/pricing" className="account-row">
            <span>Gérer l'abonnement</span>
            <span className="chevron">›</span>
          </Link>
          <Link to="/pricing" className="account-row">
            <span>Recharger des crédits</span>
            <span className="chevron">›</span>
          </Link>
          <Link to="/history" className="account-row">
            <span>Historique de générations</span>
            <span className="chevron">›</span>
          </Link>
          <div className="account-row disabled">
            <span>Historique de facturation</span>
            <span className="coming-soon">Bientôt</span>
          </div>
        </div>

        <div className="referral-section card fade-up delay-3">
          <div className="referral-header">
            <span className="referral-icon">🎁</span>
            <div>
              <h2 className="account-section-title">Parrainage</h2>
              <p className="referral-subtitle">Partage ton lien et gagne des crédits</p>
            </div>
          </div>

          <div className="referral-rules">
            <div className="referral-rule">
              <span className="rule-icon">+100</span>
              <span>Ton filleul reçoit 100 crédits à son inscription</span>
            </div>
            <div className="referral-rule">
              <span className="rule-icon">+200</span>
              <span>Tu reçois 200 crédits après sa première génération</span>
            </div>
          </div>

          <div className="referral-link-box">
            <div className="referral-link">
              {referral.loading ? "Chargement…" : `${window.location.origin}/r/${referral.code}`}
            </div>
            <button className="btn btn-primary" onClick={copyLink} disabled={referral.loading || !referral.code}>
              {copied ? "Copié !" : "Copier le lien"}
            </button>
          </div>

          <div className="referral-stats">
            <div className="referral-stat">
              <div className="referral-stat-value">{referral.count}</div>
              <div className="referral-stat-label">ami{referral.count > 1 ? "s" : ""} parrainé{referral.count > 1 ? "s" : ""}</div>
            </div>
            <div className="referral-stat">
              <div className="referral-stat-value">{referral.earned.toLocaleString("fr-FR")}</div>
              <div className="referral-stat-label">crédits gagnés</div>
            </div>
          </div>
        </div>

        {!surveyCompleted && (
          <div className="survey-card card fade-up delay-3">
            <div className="survey-card-header">
              <span className="survey-icon">📋</span>
              <div>
                <h2 className="account-section-title">Questionnaire</h2>
                <p className="survey-card-text">
                  15 questions sur ton expérience · <span className="accent">+300 crédits</span> offerts
                </p>
              </div>
            </div>
            <Link to="/survey" className="btn btn-primary">
              Répondre au questionnaire
            </Link>
          </div>
        )}

        <div className="snaprouge-account card fade-up delay-3">
          <div className="snaprouge-account-header">
            <span className="snaprouge-dot" />
            <h2 className="account-section-title">SnapRouge</h2>
          </div>
          {snapRougeLoading ? (
            <p className="snaprouge-status-text">Vérification de l'accès…</p>
          ) : snapRougeAccess ? (
            <p className="snaprouge-status-text unlocked">
              Accès débloqué — <Link to="/snaprouge">ouvrir SnapRouge</Link>
            </p>
          ) : (
            <div className="snaprouge-locked">
              <p>Accès non débloqué. Débloquez-le avec un abonnement Pro/Expert ou l'achat à 9 €.</p>
              <Link to="/pricing" className="btn btn-snaprouge">
                Débloquer SnapRouge
              </Link>
            </div>
          )}
        </div>

        <div className="account-signout fade-up delay-3">
          <SignOutButton>
            <button className="btn btn-outline" onClick={() => navigate("/")}>Déconnexion</button>
          </SignOutButton>
        </div>
      </div>
    </main>
  );
}
