import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
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
      const url = query
        ? `/api/history/${user.id}/search?q=${encodeURIComponent(query)}`
        : `/api/history/${user.id}`;
      const res = await fetch(url);
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
                <div className="history-thumb" onClick={() => setPreview(item)}>
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.prompt} loading="lazy" />
                  ) : (
                    <div className="history-thumb-placeholder" />
                  )}
                  <div className="history-thumb-overlay">
                    <button className="thumb-action" title="Agrandir">👁</button>
                    <a
                      href={item.image_url}
                      download
                      className="thumb-action"
                      title="Télécharger"
                      onClick={(e) => e.stopPropagation()}
                    >
                      ⬇
                    </a>
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
              <img src={preview.image_url} alt={preview.prompt} />
              <p>{preview.prompt}</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
