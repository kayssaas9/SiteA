import { useCallback, useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import DownloadButton from "../components/DownloadButton.jsx";
import { useUserData } from "../hooks/useUserData.js";
import "./History.css";

export default function History() {
  const { user } = useUser();
  const navigate = useNavigate();
  const { plan, credits, loading: userDataLoading } = useUserData();
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const isSubscriber = ["basic", "pro", "expert"].includes(plan);
  const hasHistoryAccess = isSubscriber && (plan === "expert" || credits > 0);

  useEffect(() => {
    if (user && !userDataLoading && !hasHistoryAccess) {
      navigate("/pricing", { replace: true });
    }
  }, [hasHistoryAccess, navigate, user, userDataLoading]);

  const fetchHistory = useCallback(async () => {
    if (!user || !hasHistoryAccess) return;
    setLoading(true);
    try {
      const search = new URLSearchParams();
      if (query) search.set("q", query);
      search.set("fresh", Date.now());
      const url = `/api/history/${user.id}?${search.toString()}`;
      const res = await fetch(url, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (res.ok) {
        const nextItems = await res.json();
        setItems(nextItems);
        return nextItems;
      }
    } catch (err) {
      console.error("history fetch error", err);
    } finally {
      setLoading(false);
    }
    return [];
  }, [hasHistoryAccess, query, user?.id]);

  useEffect(() => {
    if (!userDataLoading && hasHistoryAccess) fetchHistory();
  }, [fetchHistory, hasHistoryAccess, userDataLoading]);

  // Stripe webhooks can finish just after the browser returns from Checkout.
  // Keep the history in sync so the exact teaser becomes sharp automatically.
  useEffect(() => {
    if (!user?.id || !hasHistoryAccess) return undefined;

    let pendingGenerationId = null;
    try {
      pendingGenerationId = window.localStorage.getItem("astraPendingGenerationId")
        || window.sessionStorage.getItem("astraPendingGenerationId");
    } catch {
      pendingGenerationId = null;
    }

    const checkoutReturned = window.location.search.includes("checkout=success");
    if (!pendingGenerationId && !checkoutReturned) return undefined;

    let attempts = 0;
    const timer = window.setInterval(async () => {
      attempts += 1;
      const nextItems = await fetchHistory();
      const unlocked = pendingGenerationId
        && nextItems.some((item) => item.id === pendingGenerationId && item.unlocked);
      if (unlocked || attempts >= 20) {
        if (unlocked) {
          window.localStorage.removeItem("astraPendingGenerationId");
          window.sessionStorage.removeItem("astraPendingGenerationId");
        }
        window.clearInterval(timer);
      }
    }, 1500);

    return () => window.clearInterval(timer);
  }, [fetchHistory, hasHistoryAccess, user?.id]);

  // A generation is persisted before OneShot finishes. Keep checking while
  // one is processing so the history updates even if the generator page was
  // closed or refreshed.
  const hasActiveGenerations = items.some(
    (item) => item.status === "processing" || item.status === "finalizing",
  );
  useEffect(() => {
    if (!user?.id || !hasHistoryAccess || !hasActiveGenerations) return undefined;
    const timer = window.setInterval(fetchHistory, 2000);
    return () => window.clearInterval(timer);
  }, [fetchHistory, hasActiveGenerations, hasHistoryAccess, user?.id]);

  // Refresh history when the user comes back to this tab/page.
  useEffect(() => {
    const onVisible = () => {
      if (!document.hidden && hasHistoryAccess) fetchHistory();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [fetchHistory, hasHistoryAccess, user?.id]);

  if (!user) {
    return (
      <main className="history-page">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="page">
          <p className="history-empty fade-up">Connectez-vous pour consulter votre historique.</p>
        </div>
      </main>
    );
  }

  if (userDataLoading || !hasHistoryAccess) {
    return (
      <main className="history-page">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="page">
          <p className="history-loading fade-up">Redirection vers les tarifs…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="history-page">
      <div className="blob blob-1" />
      <div className="blob blob-2" />

      <div className="page history-content">
        <div className="history-header fade-up">
          <div>
            <h1 className="page-title">Historique</h1>
            <p className="page-subtitle">Total : {items.length} génération{items.length > 1 ? "s" : ""}</p>
          </div>
        </div>

        <div className="history-search fade-up delay-1">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Rechercher par description (ex: GT3RS)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="history-search-input"
          />
        </div>

        {loading ? (
          <div className="history-loading fade-up delay-2">Chargement…</div>
        ) : items.length === 0 ? (
          <div className="history-empty fade-up delay-2">
            {query ? "Aucun résultat pour cette recherche." : "Aucune génération enregistrée pour l'instant."}
          </div>
        ) : (
          <div className="history-grid">
            {items.map((item, idx) => (
              <div key={item.id} className={`history-card fade-up delay-${Math.min(idx % 4 + 1, 4)}`}>
                <div
                  className="history-thumb"
                  onClick={() => item.image_url && setPreview(item)}
                >
                  {item.image_url ? (
                    <div className={`history-image-wrap ${item.unlocked ? "" : "is-teaser"}`}>
                      <img src={item.image_url} alt={item.prompt} loading="lazy" />
                      {!item.unlocked && <span className="history-teaser-badge">À débloquer</span>}
                    </div>
                  ) : item.status === "processing" || item.status === "finalizing" ? (
                    <div className="history-thumb-placeholder history-thumb-processing">
                      <span>Génération en cours…</span>
                    </div>
                  ) : item.status === "failed" ? (
                    <div className="history-thumb-placeholder history-thumb-failed">
                      <span>Génération échouée</span>
                    </div>
                  ) : (
                    <div className="history-thumb-placeholder" />
                  )}
                  <div className="history-thumb-overlay">
                    <button className="thumb-action" title="Agrandir">👁</button>
                    {item.unlocked ? (
                       <DownloadButton
                        className="thumb-action"
                         imageUrl={item.image_url}
                      >
                        ⬇
                       </DownloadButton>
                    ) : item.status === "completed" ? (
                      <LinkToPricing />
                    ) : null}
                  </div>
                </div>
                <div className="history-meta">
                  <div className="history-prompt">{item.prompt}</div>
                  <div className="history-mode">{item.mode}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {preview && (
          <div className="preview-overlay" onClick={() => setPreview(null)}>
            <div className="preview-content" onClick={(e) => e.stopPropagation()}>
               <div className={preview.unlocked ? "" : "preview-teaser-image"}>
                 <img src={preview.image_url} alt={preview.prompt} />
               </div>
              <p>{preview.prompt}</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function LinkToPricing() {
  return (
    <a
      href="/pricing"
      className="thumb-action"
      title="Débloquer"
      onClick={(e) => e.stopPropagation()}
    >
      🔓
    </a>
  );
}
