import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { formatDailyGenerationCount } from "../lib/liveGenerationCounter.js";
import "./Landing.css";
import "./LandingRedesign.css";

const CUSTOMER_REVIEWS = [
  { username: "@meca_matteo", review: "Le rendu de ma Golf en full black est juste incroyable, on dirait une vraie photo de shooting.", rating: 5 },
  { username: "@ines.cars", review: "J'ai enfin pu tester mes idées de jantes avant de les acheter. Le résultat est ultra propre.", rating: 5 },
  { username: "@slammed_yno", review: "La transformation est folle. Même mes potes n'ont pas capté que c'était généré.", rating: 5 },
  { username: "@nox_rsx", review: "Super rapide et hyper réaliste, surtout les reflets sur la carrosserie.", rating: 5 },
  { username: "@lil_turbo", review: "Astra m'a permis de visualiser exactement le look que je voulais pour ma caisse.", rating: 5 },
  { username: "@drift.max", review: "Le avant/après est tellement convaincant que je l'ai posté direct en story.", rating: 5 },
  { username: "@daily_gti", review: "J'ai changé la couleur et les jantes de ma GTI en quelques secondes. Le résultat est bluffant.", rating: 5 },
  { username: "@luxeautomotive", review: "Les détails de carrosserie et les reflets sont vraiment propres, même en zoomant.", rating: 5 },
  { username: "@rs6.addict", review: "Parfait pour essayer plusieurs styles avant de passer chez le préparateur.", rating: 5 },
  { username: "@maria_drive", review: "L'outil est simple à utiliser et les rendus donnent immédiatement des idées.", rating: 5 },
  { username: "@blacklist_06", review: "J'ai testé trois looks différents sur ma voiture, tous très réalistes.", rating: 5 },
  { username: "@urban_rider", review: "Le résultat final ressemble vraiment à une photo prise en studio.", rating: 5 },
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
  {
    original: "Parking de quartier",
    result: "Mercedes-AMG A 45 S",
    ending: "même décor.",
    beforeImage: "/landing-examples/parking-before.jpeg",
    afterImage: "/landing-examples/parking-after.png",
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
    const duration = 30000;
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

function HeroVisual() {
  return (
    <div className="hero-visual" aria-label="Exemples de transformations d'images par Astracrea">
      <div className="hero-visual-orbit hero-visual-orbit-one" />
      <div className="hero-visual-orbit hero-visual-orbit-two" />
      <div className="hero-visual-card hero-visual-card-main">
        <img src="/landing-examples/parking-before.jpeg" alt="Photo originale d'une voiture sur un parking" />
        <span className="hero-visual-chip">PHOTO ORIGINALE</span>
        <div className="hero-visual-card-footer">
          <span>Photo originale</span>
          <strong>01</strong>
        </div>
      </div>
      <div className="hero-visual-card hero-visual-card-result">
        <img src="/landing-examples/parking-after.png" alt="Mercedes générée par Astracrea sur le même parking" />
        <span className="hero-visual-chip hero-visual-chip-result">RÉSULTAT ASTRA</span>
        <div className="hero-visual-card-footer">
          <span>Résultat Astra</span>
          <strong>02</strong>
        </div>
      </div>
      <div className="hero-visual-arrow" aria-hidden="true">
        <span>✦</span>
        <svg viewBox="0 0 48 48" fill="none">
          <path d="M7 24h32M27 12l12 12-12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="hero-visual-prompt">
        <span className="hero-prompt-dot" />
        <span>« Transforme cette idée en image »</span>
      </div>
    </div>
  );
}

function ReviewsMarquee() {
  const trackRef = useRef(null);

  useEffect(() => {
    let animationFrame;
    const duration = 60000;
    const start = performance.now();

    const moveReviews = (now) => {
      const sequence = trackRef.current?.firstElementChild;
      const sequenceWidth = sequence ? sequence.getBoundingClientRect().width + 16 : 0;
      const progress = ((now - start) % duration) / duration;
      const offset = -sequenceWidth + (progress * sequenceWidth);

      if (trackRef.current && sequenceWidth > 0) {
        trackRef.current.style.transform = `translate3d(${offset}px, 0, 0)`;
      }

      animationFrame = window.requestAnimationFrame(moveReviews);
    };

    animationFrame = window.requestAnimationFrame(moveReviews);

    return () => window.cancelAnimationFrame(animationFrame);
  }, []);

  return (
    <div className="reviews-track">
      <div ref={trackRef} className="reviews-items">
        {[0, 1].map((copy) => (
          <div className="reviews-sequence" key={copy}>
            {CUSTOMER_REVIEWS.map((review) => (
              <article className="review-card" key={`${copy}-${review.username}`}>
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
        ))}
      </div>
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
        <div className="hero-kicker fade-up">
          <span className="badge-dot" />
          <strong>ASTRACREA</strong>
          <span>/</span>
          Transforme tes idées en images
        </div>
        <h1 className="hero-title fade-up delay-1">
          <span className="hero-title-line">Imagine plus.</span>
          <span className="hero-title-line hero-title-accent">Crée mieux.</span>
          <span className="hero-title-line">Montre tout.</span>
        </h1>
        <p className="hero-description fade-up delay-2">
          Transforme tes photos en images qui arrêtent le scroll.
          <br />
          Une idée, un prompt, un rendu qui te ressemble.
        </p>
        <div className="hero-cta fade-up delay-2">
          <Link to="/sign-up" className="btn btn-primary">Créer ma première image <span aria-hidden="true">↗</span></Link>
          <a href="#exemples" className="hero-secondary-link">Voir les résultats <span aria-hidden="true">↓</span></a>
        </div>
        <HeroVisual />

      </section>

      <LiveGenerationCounter />

      <section id="avis" className="reviews-section fade-up delay-5" aria-label="Avis clients">
        <div className="reviews-header">
          <span className="reviews-eyebrow">ILS ONT TESTÉ ASTRA</span>
          <h2 className="reviews-title">Des rendus qui font tourner les têtes</h2>
        </div>
        <ReviewsMarquee />
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

  useEffect(() => {
    const imageSources = LANDING_EXAMPLES.flatMap(({ beforeImage, afterImage }) => [
      beforeImage,
      afterImage,
    ]);

    imageSources.forEach((source) => {
      const image = new Image();
      image.decoding = "async";
      image.src = source;
    });
  }, []);

  return (
    <section id="exemples" className="examples-section fade-up delay-5">
      <h2 className="examples-title">
        Le résultat <span className="examples-title-accent">Astra</span>
      </h2>

      <div className="example-showcase">
        <div className="example-showcase-comparison">
          <div className="example-side">
            <div className="example-image example-before">
              <img
                className="example-photo"
                src={example.beforeImage}
                alt={example.original}
              />
            </div>
            <div className="example-copy">
              <span className="example-copy-label">Photo originale</span>
              <strong>{example.original}</strong>
            </div>
          </div>

          <div className="example-side">
            <div className="example-image example-after">
              <img
                className="example-photo"
                src={example.afterImage}
                alt={example.result}
              />
            </div>
            <div className="example-copy example-copy-result">
              <span className="example-copy-label">Résultat Astra</span>
              <strong>{example.result}</strong>
              <span>{example.ending}</span>
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
  const scrollPositionRef = useRef(null);

  const rememberScrollPosition = () => {
    scrollPositionRef.current = {
      left: window.scrollX,
      top: window.scrollY,
    };
  };

  const toggle = (idx) => {
    setOpenIndex((currentIndex) => (currentIndex === idx ? null : idx));
  };

  useLayoutEffect(() => {
    const position = scrollPositionRef.current;
    if (!position) return;

    window.scrollTo({
      left: position.left,
      top: position.top,
      behavior: "auto",
    });
    const frame = window.requestAnimationFrame(() => {
      window.scrollTo({
        left: position.left,
        top: position.top,
        behavior: "auto",
      });
    });
    scrollPositionRef.current = null;

    return () => window.cancelAnimationFrame(frame);
  }, [openIndex]);

  return (
    <section id="faq" className="faq-section fade-up delay-5">
      <h2 className="faq-title">Questions récurrentes</h2>
      <p className="faq-subtitle">Tout ce que vous devez savoir sur Astra</p>
      <div className="faq-list">
        {FAQS.map((item, idx) => (
          <div key={idx} className={`faq-item ${openIndex === idx ? "open" : ""}`}>
            <button
              className="faq-question"
              onMouseDown={(event) => {
                rememberScrollPosition();
                event.preventDefault();
              }}
              onPointerDown={(event) => {
                rememberScrollPosition();
                event.preventDefault();
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  rememberScrollPosition();
                  toggle(idx);
                }
              }}
              onClick={(event) => {
                event.currentTarget.blur();
                toggle(idx);
              }}
              type="button"
              aria-expanded={openIndex === idx}
              aria-controls={`faq-answer-${idx}`}
            >
              {item.question}
              <svg className="faq-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <div
              id={`faq-answer-${idx}`}
              className="faq-answer"
              aria-hidden={openIndex !== idx}
            >
              <div className="faq-answer-inner">{item.answer}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
