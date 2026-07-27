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
        <div className="badge fade-up">
          <span className="badge-dot" />
          La V3 est maintenant disponible
        </div>
        <h1 className="hero-title fade-up delay-1">
          <span className="hero-title-line">Modifie ta voiture</span>
          <span className="hero-title-breath">Et</span>
          <span className="hero-title-line">Rend dingue tes potes</span>
        </h1>
        <p className="hero-sub fade-up delay-2">
          Envoie une photo, décris ta vision — nouvelle couleur, jantes forgées, kit large — et regarde ta voiture de rêve prendre vie en quelques secondes. Le rendu est tellement bluffant que tes potes n'y croiront pas.
        </p>
        <div className="hero-cta fade-up delay-3">
          <Link to="/generate" className="btn btn-primary">Essayer</Link>
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

      <FaqAccordion />
    </main>
  );
}

const FAQS = [
  {
    question: "Comment fonctionne la modification de voiture ?",
    answer: "Tu uploades une photo de ta voiture, tu décris la modification souhaitée (couleur, jantes, kit carrosserie...) et notre IA génère un rendu réaliste en quelques secondes.",
  },
  {
    question: "Les crédits expirent-ils ?",
    answer: "Les crédits achetés via les packs de recharge n'expirent pas. Les crédits inclus dans les abonnements se renouvellent chaque mois.",
  },
  {
    question: "Puis-je utiliser les images générées commercialement ?",
    answer: "Oui, tu as tous les droits sur les images que tu génères avec Vysion, que ce soit pour un usage personnel ou commercial.",
  },
  {
    question: "Quelle est la qualité des rendus ?",
    answer: "Nos modèles produisent des images en haute définition, avec un rendu photoréaliste adapté à la couleur, l'éclairage et les proportions de ta voiture originale.",
  },
  {
    question: "Comment fonctionne le tutoriel Snap Rouge ?",
    answer: "Le tutoriel Snap Rouge est un guide premium qui t'explique étape par étape comment envoyer tes photos IA générées en snap rouge, sans être détecté.",
  },
];

function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState(null);
  const toggle = (idx) => setOpenIndex(openIndex === idx ? null : idx);

  return (
    <section id="faq" className="faq-section fade-up delay-5">
      <h2 className="faq-title">Questions fréquentes</h2>
      <div className="faq-list">
        {FAQS.map((item, idx) => (
          <div key={idx} className={`faq-item ${openIndex === idx ? "open" : ""}`}>
            <button className="faq-question" onClick={() => toggle(idx)} type="button">
              {item.question}
              <span className="faq-icon">+</span>
            </button>
            <div className="faq-answer">
              <div className="faq-answer-inner">{item.answer}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
