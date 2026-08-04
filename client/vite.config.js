import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const publicEnv = {
  clerkPublishableKey:
    process.env.VITE_CLERK_PUBLISHABLE_KEY
    || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    || "",
  stripePublishableKey:
    process.env.VITE_STRIPE_PUBLISHABLE_KEY
    || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    || "",
  supabaseUrl:
    process.env.VITE_SUPABASE_URL
    || process.env.NEXT_PUBLIC_SUPABASE_URL
    || "",
  supabaseAnonKey:
    process.env.VITE_SUPABASE_ANON_KEY
    || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    || "",
  crispWebsiteId:
    process.env.VITE_CRISP_WEBSITE_ID
    || process.env.CRISP_WEBSITE_ID
    || "",
  clerkProxyUrl:
    process.env.VITE_CLERK_PROXY_URL
    || (process.env.NODE_ENV === "production" ? "/api/__clerk" : "")
    || "",
};

export default defineConfig({
  plugins: [react()],
  define: {
    "import.meta.env.VITE_CLERK_PUBLISHABLE_KEY": JSON.stringify(publicEnv.clerkPublishableKey),
    "import.meta.env.VITE_CLERK_PROXY_URL": JSON.stringify(publicEnv.clerkProxyUrl),
    "import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY": JSON.stringify(publicEnv.stripePublishableKey),
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(publicEnv.supabaseUrl),
    "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(publicEnv.supabaseAnonKey),
    "import.meta.env.VITE_CRISP_WEBSITE_ID": JSON.stringify(publicEnv.crispWebsiteId),
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
