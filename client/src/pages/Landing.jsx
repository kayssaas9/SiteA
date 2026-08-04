import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { formatDailyGenerationCount } from "../lib/liveGenerationCounter.js";
import "./Landing.css";

const CUSTOMER_REVIEWS = [
  { username: "@meca_matteo", review: "Le rendu de ma Golf en full black est juste incroyable, on dirait une vraie photo de shooting.", rating: 5 },
  { username: "@ines.cars", review: "J'ai enfin pu tester mes idées de jantes avant de les acheter. Le résultat est ultra propre.", rating: 5 },
  { username: "@slammed_yno", review: "La transformation est folle. Même mes potes n'ont pas capté que c'était généré.", rating: 5 },
  { username: "@nox_rsx", review: "Super rapide et hyper réaliste, surtout les reflets sur la carrosserie.", rating: 5 },
  { username: "@lil_turbo", review: "Astra m'a permis de visualiser exactement le look que je voulais pour ma caisse.", rating: 5 },
  { username: "@drift.max", review: "Le avant/après est tellement convaincant que je l'ai posté direct en story.", rating: 5 },
];

const LANDING_EXAMPLES = [
  {
    original: "BMW M3 G80",
    result: "Lamborghini Aventador SVJ",
    ending: "décor identique.",
    beforeImage: "/landing-examples/bmw-m3-g80-before.png",
    afterImage: "/landing-examples/lamborghini-aventador-svj-after.png",
  },
  {
    original: "Montre Rolex Dayjust en classe",
    result: "Richard Mille Bubba Watson",
    ending: "même poignet.",
    beforeImage: "/landing-examples/rolex-dayjust-before.png",
    afterImage: "/landing-examples/richard-mille-bubba-watson-after.png",
  },
];

const HERO_IMAGES = [
  "/landing-examples/hero-lamborghini-road.png",
  "/landing-examples/hero-watch.png",
  "/landing-examples/hero-couple.png",
  "/landing-examples/hero-jet.png",
];

function HeroBackground() {
  const trackRef = useRef(null);

  useEffect(() => {
    let animationFrame;
    const duration = 18000;
    const start = performance.now();

    const moveTrack = (now) => {
      const sequenceWidth = window.innerWidth * 2;
      const progress = ((now - start) % duration) / duration;
      const offset = -(progress * sequenceWidth);

      if (trackRef.current) {
        trackRef.current.style.transform = `translate3d(${offset}px, 0, 0)`;
      }

      animationFrame = window.requestAnimationFrame(moveTrack);
    };

    animationFrame = window.requestAnimationFrame(moveTrack);

    return () => window.cancelAnimationFrame(animationFrame);
  }, []);

  return (
    <div className="hero-background" aria-hidden="true">
      <div ref={trackRef} className="hero-photo-track">
        {[...HERO_IMAGES, ...HERO_IMAGES].map((image, imageIndex) => (
          <div
            className="hero-photo"
            key={`${image}-${imageIndex}`}
            style={{ backgroundImage: `url("${image}")` }}
          />
        ))}
      </div>
      <div className="hero-background-shade" />
      <div className="hero-background-center" />
    </div>
  );
}

function LiveGenerationCounter() {
  const [count] = useState(formatDailyGenerationCount);

  return (
    <div className="live-generation-counter" aria-live="polite">
      <span className="live-counter-people" aria-hidden="true">
        🧑🏻‍🦰👩🏼‍🦱🧑🏽‍🦲
      </span>
      <strong>{count}</strong>
      <span>personnes ont généré une image aujourd'hui</span>
    </div>
  );
}

export default function Landing() {
  const { isSignedIn } = useUser();

  return (
    <main className="landing-page">
      <div className="blob blob-1" />
      <div className="blob blob-2" />

      <section className="hero">
        <HeroBackground />
        <div className="badge fade-up">
          <span className="badge-dot" />
          La V3 est maintenant disponible
        </div>
        <h1 className="hero-title fade-up delay-1">
          <span className="hero-title-line">Modifie ta voiture</span>
          <span className="hero-title-breath">Et</span>
          <span className="hero-title-line">Rend dingue tes potes</span>
        </h1>
        <div className="hero-cta fade-up delay-2">
          <Link to="/sign-up" className="btn btn-primary">Essayer</Link>
        </div>

      </section>

      <LiveGenerationCounter />

      <section id="avis" className="reviews-section fade-up delay-5" aria-label="Avis clients">
        <div className="reviews-header">
          <span className="reviews-eyebrow">ILS ONT TESTÉ ASTRA</span>
          <h2 className="reviews-title">Des rendus qui font tourner les têtes</h2>
        </div>
        <div className="reviews-track">
          <div className="reviews-items">
            {[...CUSTOMER_REVIEWS, ...CUSTOMER_REVIEWS].map((review, index) => (
              <article className="review-card" key={`${review.username}-${index}`}>
                <div className="review-card-top">
                  <strong>{review.username}</strong>
                  <span className="review-stars" aria-label={`${review.rating} étoiles`}>
                    {"★".repeat(review.rating)}
                  </span>
                </div>
                <p>“{review.review}”</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <Examples />

      <FaqAccordion />
    </main>
  );
}

function Examples() {
  const { isSignedIn } = useUser();
  const [exampleIndex, setExampleIndex] = useState(0);
  const example = LANDING_EXAMPLES[exampleIndex];

  return (
    <section id="exemples" className="examples-section fade-up delay-5">
      <h2 className="examples-title">
        Le résultat <span className="examples-title-accent">Astra</span>
      </h2>

      <div className="example-showcase">
        <div className="example-showcase-comparison">
          <div className="example-side">
            <span className="example-badge example-badge-before">AVANT</span>
            <div className="example-image example-before">
              <img
                className="example-photo"
                src={example.beforeImage}
                alt={example.original}
              />
              <div className="example-caption">
                <strong>Photo originale :</strong>{" "}
                <span className="example-caption-detail">{example.original}</span>
              </div>
            </div>
          </div>

          <div className="example-side">
            <span className="example-badge example-badge-after">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              APRÈS
            </span>
            <div className="example-image example-after">
              <img
                className="example-photo"
                src={example.afterImage}
                alt={example.result}
              />
              <span className="example-quality-badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
                ULTRA-RÉALISTE
              </span>
              <div className="example-caption">
                <div className="example-caption-title">Ultra-réalisme Astra ✨</div>
                <strong>Résultat Astra :</strong> Transformation en{" "}
                <span className="example-caption-detail">
                  {example.result}, {example.ending}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button
        className="examples-more"
        type="button"
        onClick={() => setExampleIndex((currentIndex) => (currentIndex + 1) % LANDING_EXAMPLES.length)}
      >
        Voir plus d'exemples
      </button>

      <Link to={isSignedIn ? "/generate" : "/sign-up"} className="btn btn-primary examples-cta">
        Démarrer avec Astra
      </Link>
    </section>
  );
}

const FAQS = [
  {
    question: "Comment fonctionne la génération d'images ?",
    answer: "Astra utilise les modèles d'IA les plus avancés au monde pour transformer vos photos et descriptions en rendus photoréalistes. Il vous suffit d'envoyer une photo de votre voiture et de décrire ce que vous voulez, notre IA s'occupe du reste.",
  },
  {
    question: "Les photos m'appartiennent-elles ?",
    answer: "Oui, vous disposez d'une licence commerciale complète sur toutes les images que vous générez avec un abonnement actif.",
  },
  {
    question: "Puis-je annuler mon abonnement ?",
    answer: "Bien sûr. Vous pouvez annuler votre abonnement à tout moment depuis votre espace client. Vous conserverez vos accès jusqu'à la fin de la période facturée.",
  },
  {
    question: "Qu'est-ce que le système SnapRouge ?",
    answer: "C'est une fonctionnalité exclusive d'Astra qui permet d'envoyer vos photos générées par IA sur Snapchat de manière totalement indétectable, comme s'il s'agissait de photos prises en direct.",
  },
  {
    question: "Les paiements sont-ils sécurisés ?",
    answer: "Absolument. Tous les paiements sont traités par Stripe, le leader mondial du paiement en ligne. Vos informations bancaires ne transitent jamais par nos serveurs et sont chiffrées de bout en bout.",
  },
  {
    question: "Mes photos générées sont-elles confidentielles ?",
    answer: "Oui, la confidentialité est notre priorité. Vos créations sont privées par défaut et ne sont jamais partagées sans votre accord. Nous n'utilisons pas vos photos pour entraîner nos modèles sans votre consentement explicite.",
  },
];

function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState(null);
  const toggle = (idx) => setOpenIndex(openIndex === idx ? null : idx);

  return (
    <section id="faq" className="faq-section fade-up delay-5">
      <h2 className="faq-title">Questions récurrentes</h2>
      <p className="faq-subtitle">Tout ce que vous devez savoir sur Astra</p>
      <div className="faq-list">
        {FAQS.map((item, idx) => (
          <div key={idx} className={`faq-item ${openIndex === idx ? "open" : ""}`}>
            <button className="faq-question" onClick={() => toggle(idx)} type="button">
              {item.question}
              <svg className="faq-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
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
