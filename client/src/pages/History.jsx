import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import DownloadButton from "../components/DownloadButton.jsx";
import "./History.css";

export default function History() {
  const { user } = useUser();
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  const fetchHistory = async () => {
    if (!user) return;
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
      if (res.ok) setItems(await res.json());
    } catch (err) {
      console.error("history fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user?.id, query]);

  // A generation is persisted before OneShot finishes. Keep checking while
  // one is processing so the history updates even if the generator page was
  // closed or refreshed.
  const hasActiveGenerations = items.some(
    (item) => item.status === "processing" || item.status === "finalizing",
  );
  useEffect(() => {
    if (!user?.id || !hasActiveGenerations) return undefined;
    const timer = window.setInterval(fetchHistory, 2000);
    return () => window.clearInterval(timer);
  }, [user?.id, query, hasActiveGenerations]);

  // Refresh history when the user comes back to this tab/page.
  useEffect(() => {
    const onVisible = () => {
      if (!document.hidden) fetchHistory();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [user?.id]);

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
