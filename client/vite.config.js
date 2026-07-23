import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  define: {
    // Remap NEXT_PUBLIC_* secrets → VITE_* for frontend access
    "import.meta.env.VITE_CLERK_PUBLISHABLE_KEY": JSON.stringify(
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? ""
    ),
    "import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY": JSON.stringify(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ""
    ),
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
    ),
    "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
    ),
    "import.meta.env.VITE_CRISP_WEBSITE_ID": JSON.stringify(
      process.env.CRISP_WEBSITE_ID ?? ""
    ),
    // Vite expose automatiquement les variables d'environnement préfixées par VITE_
    // aux fichiers clients (ex: VITE_STRIPE_PRICE_*). Aucun remapping n'est nécessaire.
  },
  server: {
    host: "0.0.0.0",
    port: 5000,
    allowedHosts: true,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
