import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  define: {
    // Expose the Clerk publishable key to the frontend bundle.
    // The secret is stored as NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY in Replit;
    // Vite requires VITE_* prefix, so we remap it here.
    "import.meta.env.VITE_CLERK_PUBLISHABLE_KEY": JSON.stringify(
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? ""
    ),
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
