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
  const recentHistory = history.slice(0, 8);
  const totalPlatforms = useMemo(() => {
    const values = new Set<string>();
    history.forEach((item) => item.platforms.forEach((platform) => values.add(platform)));
    return values.size;
  }, [history]);
  const mostUsedPlatform = useMemo(() => {
    const counts = new Map<string, number>();
    history.forEach((item) => item.platforms.forEach((platform) => counts.set(platform, (counts.get(platform) ?? 0) + 1)));
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "None yet";
  }, [history]);
  const aiBackedCount = useMemo(() => history.filter((item) => item.generation_mode === "ai").length, [history]);

  return (
    <div className="page-stack page-enter">
      <section className="panel compact-panel history-hero-panel">
        <div className="section-heading no-margin hero-heading-row">
          <div>
            <span className="eyebrow-text">Usage dashboard</span>
            <h3>Here is everything we have generated with you so far.</h3>
            <p>Come here when you want to check momentum, revisit a strong week, or grab a sheet without walking back through the whole studio.</p>
          </div>
          <button className="secondary-btn small-btn" type="button" onClick={() => void loadHistory()}>
            Refresh archive
          </button>
        </div>

        <div className="metric-grid history-metrics dashboard-metrics-four">
          <div className="metric-card">
            <span className="metric-label">Calendars</span>
            <strong>{history.length}</strong>
          </div>
          <div className="metric-card">
            <span className="metric-label">Rows generated</span>
            <strong>{totalHistoryRows}</strong>
          </div>
          <div className="metric-card">
            <span className="metric-label">Platforms covered</span>
            <strong>{totalPlatforms}</strong>
          </div>
          <div className="metric-card accent-metric">
            <span className="metric-label">Most used</span>
            <strong>{mostUsedPlatform}</strong>
          </div>
        </div>
      </section>

      <section className="dashboard-insight-grid">
        <article className="panel compact-panel insight-card">
          <div className="section-heading no-margin">
            <span className="eyebrow-text">Output signal</span>
            <h3>{aiBackedCount} AI-first runs recorded</h3>
            <p>We keep that signal visible so you can tell, at a glance, how much of your archive came from full AI generation.</p>
          </div>
        </article>

        <article className="panel compact-panel insight-card">
          <div className="section-heading no-margin">
            <span className="eyebrow-text">Archive value</span>
            <h3>Your latest sheets stay close by</h3>
            <p>When you want to reopen something strong, download it again, or compare one week to the next, this page is ready for you.</p>
          </div>
        </article>
      </section>

      <section className="panel compact-panel">
        <div className="section-heading no-margin section-row">
          <div>
            <span className="eyebrow-text">Recent generations</span>
            <h3>Every successful run lands here automatically.</h3>
          </div>
          {isHistoryLoading ? <span className="status-pill neutral">Loading…</span> : null}
        </div>

        {historyError ? <div className="error-box">{historyError}</div> : null}

        {!isHistoryLoading && recentHistory.length === 0 && !historyError ? (
          <div className="empty-cell mobile-empty">Nothing saved yet. Generate your first calendar and we will start your archive.</div>
        ) : null}

        <div className="history-list">
          {recentHistory.map((item) => (
            <article className="history-card" key={item.id}>
              <div className="history-card-main">
                <div>
                  <span className="mobile-record-label">{formatHistoryDate(item.created_at)}</span>
                  <h4>{item.weekly_focus}</h4>
                  <p>{item.company_summary}</p>
                </div>
                <span className={`history-mode ${item.generation_mode ?? "saved"}`}>{item.generation_mode ?? "saved"}</span>
              </div>
              <div className="history-meta">
                <span>{item.platforms.join(", ")}</span>
                <span>{item.total_rows} rows</span>
                <span>{item.posts_per_day}/day</span>
                <span>{item.number_of_days} days</span>
              </div>
              <div className="history-actions">
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
