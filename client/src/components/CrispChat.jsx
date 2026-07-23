import { useEffect } from "react";

const CRISP_WEBSITE_ID = import.meta.env.VITE_CRISP_WEBSITE_ID;
const ACCENT_COLOR = "#8EC5E8";

/**
 * Loads the Crisp chat widget on every page.
 *
 * The accent color is best configured from the Crisp dashboard:
 * Settings → Chatbox Settings → Chatbox Appearance → Advanced Chatbox Customization.
 * We also attempt to pass a runtime color hint via the JS SDK; if Crisp honours it,
 * the widget will use the site blue (#8EC5E8).
 */
export default function CrispChat() {
  useEffect(() => {
    if (!CRISP_WEBSITE_ID) return;

    // Avoid loading the script twice on React Strict Mode re-mounts.
    if (document.getElementById("crisp-chat-script")) return;

    window.$crisp = window.$crisp || [];
    window.CRISP_WEBSITE_ID = CRISP_WEBSITE_ID;

    // Best-effort runtime color hint (dashboard setting takes precedence).
    if (!window.CRISP_RUNTIME_CONFIG) {
      window.CRISP_RUNTIME_CONFIG = {};
    }
    if (!window.CRISP_RUNTIME_CONFIG.theme) {
      window.CRISP_RUNTIME_CONFIG.theme = {};
    }
    window.CRISP_RUNTIME_CONFIG.theme.color = ACCENT_COLOR;

    const script = document.createElement("script");
    script.id = "crisp-chat-script";
    script.src = "https://client.crisp.chat/l.js";
    script.async = 1;
    document.head.appendChild(script);

    // Try to push the accent color once the chatbox is ready.
    const setColor = () => {
      try {
        window.$crisp.push(["config", "color:theme", ACCENT_COLOR]);
      } catch {
        // Dashboard color setting will be used if this is not supported.
      }
    };
    setColor();
    window.$crisp.push(["on", "chat:init", setColor]);

    return () => {
      // We intentionally keep the widget alive across route changes.
    };
  }, []);

  return null;
}
