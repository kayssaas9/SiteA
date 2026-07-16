import { useState } from "react";
import Header from "./components/Header.jsx";
import ModeSelector from "./components/ModeSelector.jsx";
import OutfitGenerator from "./components/OutfitGenerator.jsx";
import CarReplacer from "./components/CarReplacer.jsx";
import "./App.css";

export default function App() {
  const [mode, setMode] = useState("outfit");

  return (
    <div className="app">
      <Header />
      <main className="main">
        <div className="hero">
          <div className="hero-badge">✦ Powered by AI</div>
          <h1 className="hero-title">
            Create anything
            <span className="gradient-text"> with AI</span>
          </h1>
          <p className="hero-sub">
            Visualise new outfits on yourself, or upgrade your car — all
            generated in seconds.
          </p>
        </div>

        <ModeSelector mode={mode} onChange={setMode} />

        <div className="generator-container">
          {mode === "outfit" ? <OutfitGenerator /> : <CarReplacer />}
        </div>
      </main>

      <footer className="footer">
        <p>© 2025 nano-banana · AI Image Studio</p>
      </footer>
    </div>
  );
}
