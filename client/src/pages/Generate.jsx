import { useState } from "react";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import ImageGenerator from "../components/ImageGenerator.jsx";
import "./Generate.css";

const MODES = [
  {
    id: "outfit",
    label: "Tenues",
    icon: "👕",
    presets: [
      "Streetwear", "Tenue de bureau", "Costume", "Robe d'été",
      "Sportswear", "Y2K", "Bohème chic", "Minimaliste",
    ],
    mainLabel: "Votre photo",
    mainHint: "Ajoutez une photo pour visualiser la tenue sur vous (optionnel)",
    promptLabel: "Description de la tenue",
    promptHint: "Décrivez le look, ou choisissez un style ci-dessous",
    promptPlaceholder: "Ex. : une tenue streetwear toute noire avec un hoodie oversize et un cargo",
    generateLabel: "Générer la tenue",
  },
  {
    id: "car",
    label: "Voiture",
    icon: "🚗",
    presets: [
      "Lamborghini Urus", "Ferrari 488", "Porsche 911 GT3",
      "Mercedes Classe G", "Rolls-Royce Phantom", "Tesla Model S Plaid",
      "McLaren 720S", "Bentley Continental GT",
    ],
    mainLabel: "Votre voiture actuelle",
    mainHint: "Ajoutez une photo de votre voiture ou de la scène à modifier (optionnel)",
    promptLabel: "Voiture de rêve",
    promptHint: "Choisissez un modèle ou décrivez la voiture souhaitée",
    promptPlaceholder: "Ex. : une Lamborghini Urus bleue nuit garée à Monaco au coucher du soleil",
    generateLabel: "Générer la voiture",
  },
];

export default function Generate() {
  const [mode, setMode] = useState("outfit");
  const activeMode = MODES.find((m) => m.id === mode);

  return (
    <main className="generate-page">
      <div className="blob blob-1" />
      <div className="blob blob-2" />

      <div className="page generate-content">
        <div className="generate-header fade-up">
          <h1 className="page-title">Générer une <span className="accent">image</span></h1>
          <p className="page-subtitle">Décrivez votre demande, ajoutez une photo principale optionnelle et des références si besoin.</p>
        </div>

        <div className="mode-selector-v2 fade-up delay-1">
          {MODES.map((m) => (
            <button
              key={m.id}
              className={`mode-btn ${mode === m.id ? "active" : ""}`}
              onClick={() => setMode(m.id)}
            >
              <span className="mode-icon">{m.icon}</span>
              <span>{m.label}</span>
            </button>
          ))}
        </div>

        <SignedIn>
          <div className="generate-toolbox fade-up delay-2">
            <ImageGenerator
              mode={activeMode.id}
              presets={activeMode.presets}
              mainLabel={activeMode.mainLabel}
              mainHint={activeMode.mainHint}
              promptLabel={activeMode.promptLabel}
              promptHint={activeMode.promptHint}
              promptPlaceholder={activeMode.promptPlaceholder}
              generateLabel={activeMode.generateLabel}
            />
          </div>
        </SignedIn>

        <SignedOut>
          <div className="generate-auth fade-up delay-2">
            <p>Connectez-vous pour générer des images.</p>
            <Link to="/sign-in" className="btn btn-primary">
              Se connecter
            </Link>
          </div>
        </SignedOut>
      </div>
    </main>
  );
}
