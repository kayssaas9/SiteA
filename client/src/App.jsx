import { createBrowserRouter, Navigate, Outlet, RouterProvider } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useEffect } from "react";
import Header from "./components/Header.jsx";
import Landing from "./pages/Landing.jsx";
import Generate from "./pages/Generate.jsx";
import Pricing from "./pages/Pricing.jsx";
import Account from "./pages/Account.jsx";
import History from "./pages/History.jsx";
import SnapRouge from "./pages/SnapRouge.jsx";
import SignIn from "./pages/SignIn.jsx";
import SignUp from "./pages/SignUp.jsx";
import SsoCallback from "./pages/SsoCallback.jsx";
import SnapRougeGuard from "./components/SnapRougeGuard.jsx";
import Survey from "./pages/Survey.jsx";
import ReferralLanding from "./components/ReferralLanding.jsx";
import CrispChat from "./components/CrispChat.jsx";
import "./App.css";

function Layout() {
  return (
    <div className="app">
      <Header />
      <Outlet />
      <footer className="footer">
        <p>© 2026 Vysion · IA visuelle propriétaire</p>
      </footer>
    </div>
  );
}

function AppWithReferral() {
  const { user } = useUser();

  useEffect(() => {
    if (!user) return;
    const pendingCode = localStorage.getItem("vysionReferralCode");
    if (!pendingCode) return;

    fetch("/api/referral/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clerkUserId: user.id, referralCode: pendingCode }),
    }).then((res) => {
      if (res.ok) localStorage.removeItem("vysionReferralCode");
    });
  }, [user?.id]);

  return <RouterProvider router={router} />;
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Landing /> },
      { path: "generate", element: <Generate /> },
      { path: "pricing", element: <Pricing /> },
      { path: "account", element: <Account /> },
      { path: "history", element: <History /> },
      { path: "survey", element: <Survey /> },
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
  { path: "/sign-in", element: <SignIn /> },
  { path: "/sign-up", element: <SignUp /> },
  { path: "/sso-callback", element: <SsoCallback /> },
  { path: "/r/:code", element: <ReferralLanding /> },
]);

export default function App() {
  return (
    <>
      <CrispChat />
      <AppWithReferral />
    </>
  );
}
