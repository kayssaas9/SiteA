import "./SnapRouge.css";

const STEPS = Array.from({ length: 9 }, (_, i) => i + 1);

export default function SnapRouge() {
  return (
    <main className="snaprouge-page">
      <div className="blob blob-1" style={{ background: "var(--snaprouge)" }} />
      <div className="blob blob-2" style={{ background: "var(--snaprouge)" }} />

      <div className="page snaprouge-content">
        <div className="snaprouge-hero-v2 fade-up">
          <div className="snaprouge-badge-v2">Méthode exclusive</div>
          <h1 className="page-title">SnapRouge</h1>
          <p className="page-subtitle">La méthode en 9 étapes — du concept au rendu final.</p>
        </div>

        <div className="steps-grid">
          {STEPS.map((step, idx) => (
            <div key={step} className={`step-card fade-up delay-${Math.min(idx + 1, 4)}`}>
              <span className="step-number">Étape {step}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
