import { createBrowserRouter, Navigate, Outlet, RouterProvider } from "react-router-dom";
import Header from "./components/Header.jsx";
import Landing from "./pages/Landing.jsx";
import Generate from "./pages/Generate.jsx";
import Pricing from "./pages/Pricing.jsx";
import Account from "./pages/Account.jsx";
import History from "./pages/History.jsx";
import SnapRouge from "./pages/SnapRouge.jsx";
import SnapRougeGuard from "./components/SnapRougeGuard.jsx";
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
