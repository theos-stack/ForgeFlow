"use client";

import { useEffect, useMemo, useState } from "react";
import { buildDownloadUrl, getGenerationHistory } from "@/lib/api";
import { GenerationHistoryEvent } from "@/lib/types";

export default function DashboardView() {
  const [history, setHistory] = useState<GenerationHistoryEvent[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  async function loadHistory() {
    setIsHistoryLoading(true);
    setHistoryError(null);

    try {
      const response = await getGenerationHistory();
      setHistory(response.events);
    } catch (historyLoadError) {
      const message = historyLoadError instanceof Error ? historyLoadError.message : "Could not load dashboard history.";
      setHistoryError(message);
    } finally {
      setIsHistoryLoading(false);
    }
  }

  useEffect(() => {
    void loadHistory();
  }, []);

  const totalHistoryRows = useMemo(() => history.reduce((total, item) => total + item.total_rows, 0), [history]);
  const recentHistory = history.slice(0, 6);
  const totalPlatforms = useMemo(() => {
    const values = new Set<string>();
    history.forEach((item) => item.platforms.forEach((platform) => values.add(platform)));
    return values.size;
  }, [history]);
  const mostUsedPlatform = useMemo(() => {
    const counts = new Map<string, number>();
    history.forEach((item) => item.platforms.forEach((platform) => counts.set(platform, (counts.get(platform) ?? 0) + 1)));
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "None";
  }, [history]);

  return (
    <div className="page-stack page-enter app-dense-stack">
      <section className="panel compact-panel history-hero-panel compact-dashboard-header">
        <div className="section-heading no-margin section-row compact-section-row">
          <div>
            <span className="eyebrow-text">Dashboard</span>
            <h3>Recent work</h3>
          </div>
          <button className="secondary-btn small-btn" type="button" onClick={() => void loadHistory()}>
            Refresh
          </button>
        </div>

        <div className="metric-grid history-metrics compact-dashboard-metrics">
          <div className="metric-card">
            <span className="metric-label">Calendars</span>
            <strong>{history.length}</strong>
          </div>
          <div className="metric-card">
            <span className="metric-label">Rows</span>
            <strong>{totalHistoryRows}</strong>
          </div>
          <div className="metric-card">
            <span className="metric-label">Platforms</span>
            <strong>{totalPlatforms}</strong>
          </div>
          <div className="metric-card accent-metric">
            <span className="metric-label">Top platform</span>
            <strong>{mostUsedPlatform}</strong>
          </div>
        </div>
      </section>

      <section className="panel compact-panel compact-history-panel">
        <div className="section-heading no-margin section-row compact-section-row">
          <div>
            <span className="eyebrow-text">Archive</span>
            <h3>{isHistoryLoading ? "Loading" : "Latest 6"}</h3>
          </div>
        </div>

        {historyError ? <div className="error-box">{historyError}</div> : null}

        {!isHistoryLoading && recentHistory.length === 0 && !historyError ? (
          <div className="empty-cell mobile-empty">No saved runs yet.</div>
        ) : null}

        <div className="history-list compact-history-list">
          {recentHistory.map((item) => (
            <article className="history-card compact-history-card" key={item.id}>
              <div className="history-card-main compact-history-main">
                <div>
                  <span className="mobile-record-label">{formatHistoryDate(item.created_at)}</span>
                  <h4>{item.weekly_focus}</h4>
                  <p>{item.company_summary}</p>
                </div>
                <span className={`history-mode ${item.generation_mode ?? "saved"}`}>{item.generation_mode ?? "saved"}</span>
              </div>
              <div className="history-meta compact-history-meta">
                <span>{item.platforms.join(", ")}</span>
                <span>{item.total_rows} rows</span>
                <span>{item.number_of_days} days</span>
              </div>
              <div className="history-actions compact-history-actions">
                <span>{item.file_name}</span>
                <a className="secondary-btn small-btn" href={buildDownloadUrl(item.download_url)} target="_blank" rel="noreferrer">
                  Download
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function formatHistoryDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Saved recently";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
