import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Landing.css";

const TESTIMONIALS = [
  "Vysion a remplacé mon studio photo pour les essais de tenues.",
  "La qualité des rendus voiture est meilleure que tout ce que j'ai testé.",
  "Interface sobre, génération rapide, crédits clairs. Rien à redire.",
  "Je recommande Vysion à tous mes clients retail.",
  "L'outil le plus fiable pour visualiser des concepts avant production.",
];

const STATS = [
  { value: "2,4M+", label: "images générées" },
  { value: "4,9/5", label: "note utilisateurs" },
  { value: "< 8s", label: "temps de génération" },
];

function BeforeAfter() {
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setShowResult((v) => !v), 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="before-after">
      <div className={`before-after-side ${!showResult ? "active" : ""}`}>
        <div className="placeholder original" />
        <span className="before-after-label">Photo d'origine</span>
      </div>
      <div className={`before-after-side ${showResult ? "active" : ""}`}>
        <div className="placeholder generated" />
        <span className="before-after-label">Résultat généré par l'IA</span>
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <main className="landing-page">
      <div className="blob blob-1" />
      <div className="blob blob-2" />

      <section className="hero">
        <div className="badge fade-up">L'IA visuelle la plus avancée du marché</div>
        <h1 className="hero-title fade-up delay-1">
          Visualisez l'impossible avec <span className="accent">Vysion</span>
        </h1>
        <p className="hero-sub fade-up delay-2">
          Essayez des tenues sur vous-même. Transformez votre voiture. Générez des visuels professionnels en quelques secondes, sans équipe, sans studio.
        </p>
        <div className="hero-cta fade-up delay-3">
          <Link to="/generate" className="btn btn-primary">Essayer gratuitement</Link>
          <Link to="/pricing" className="btn btn-outline">Voir les tarifs</Link>
        </div>

        <div className="hero-demo fade-up delay-4">
          <BeforeAfter />
        </div>

        <div className="stats fade-up delay-5">
          {STATS.map((s) => (
            <div key={s.label} className="stat">
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="testimonials-section fade-up delay-5">
        <div className="testimonials-header">
          <h2 className="testimonials-title">Rejoint par des créateurs et des marques exigeantes</h2>
        </div>
        <div className="testimonials-track">
          <div className="testimonials-items">
            {[...TESTIMONIALS, ...TESTIMONIALS].map((text, i) => (
              <div key={i} className="testimonial-card">
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
