import { useState } from "react";
import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import OutfitGenerator from "../components/OutfitGenerator.jsx";
import CarReplacer from "../components/CarReplacer.jsx";
import "./Generate.css";

const MODES = [
  { id: "outfit", label: "Tenues", icon: "👕" },
  { id: "car", label: "Voiture", icon: "🚗" },
  { id: "other", label: "Autre", icon: "✨", comingSoon: true },
];

export default function Generate() {
  const [mode, setMode] = useState("outfit");

  return (
    <main className="generate-page">
      <div className="blob blob-1" />
      <div className="blob blob-2" />

      <div className="page generate-content">
        <div className="generate-header fade-up">
          <h1 className="page-title">Générer une <span className="accent">image</span></h1>
          <p className="page-subtitle">Sélectionnez un mode, décrivez le résultat attendu, et générez en un clic.</p>
        </div>

        <div className="mode-selector-v2 fade-up delay-1">
          {MODES.map((m) => (
            <button
              key={m.id}
              className={`mode-btn ${mode === m.id ? "active" : ""} ${m.comingSoon ? "disabled" : ""}`}
              onClick={() => !m.comingSoon && setMode(m.id)}
              disabled={m.comingSoon}
            >
              <span className="mode-icon">{m.icon}</span>
              <span>{m.label}</span>
              {m.comingSoon && <span className="soon">Bientôt</span>}
            </button>
          ))}
        </div>

        <SignedIn>
          <div className="generate-toolbox fade-up delay-2">
            {mode === "outfit" && <OutfitGenerator />}
            {mode === "car" && <CarReplacer />}
          </div>
        </SignedIn>

        <SignedOut>
          <div className="generate-auth fade-up delay-2">
            <p>Connectez-vous pour générer des images.</p>
            <SignInButton mode="modal">
              <button className="btn btn-primary">Se connecter</button>
            </SignInButton>
          </div>
        </SignedOut>
      </div>
    </main>
  );
}
