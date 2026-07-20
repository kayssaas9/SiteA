import { useState } from "react";
import { createBrowserRouter, Navigate, Outlet, RouterProvider } from "react-router-dom";
import Header from "./components/Header.jsx";
import ModeSelector from "./components/ModeSelector.jsx";
import OutfitGenerator from "./components/OutfitGenerator.jsx";
import CarReplacer from "./components/CarReplacer.jsx";
import Pricing from "./pages/Pricing.jsx";
import SnapRouge from "./pages/SnapRouge.jsx";
import SnapRougeGuard from "./components/SnapRougeGuard.jsx";
import "./App.css";

function Home() {
  const [mode, setMode] = useState("outfit");

  // Show checkout result banner if redirected from Stripe
  const params = new URLSearchParams(window.location.search);
  const checkoutResult = params.get("checkout");

  return (
    <main className="main">
      {checkoutResult === "success" && (
        <div className="checkout-banner success">
          🎉 Paiement confirmé ! Vos crédits ont été ajoutés.
        </div>
      )}
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
  );
}

function Layout() {
  return (
    <div className="app">
      <Header />
      <Outlet />
      <footer className="footer">
        <p>© 2025 nano-banana · AI Image Studio</p>
      </footer>
    </div>
  );
}

// Router is created once outside the render tree to avoid StrictMode
// double-initialization issues and to keep history stable across hot reloads.
const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: "pricing", element: <Pricing /> },
      {
        path: "snaprouge",
        element: (
          <SnapRougeGuard>
            <SnapRouge />
          </SnapRougeGuard>
        ),
      },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
