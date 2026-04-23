"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import AuthControls from "@/components/auth-controls";
import { buildDownloadUrl, checkHealth, generateCalendar, getGenerationHistory } from "@/lib/api";
import { CalendarRecord, GenerateResponse, GenerationHistoryEvent, Platform } from "@/lib/types";

const AVAILABLE_PLATFORMS: Platform[] = ["LinkedIn", "Instagram", "Twitter/X", "YouTube"];
const MIN_COMPANY_DETAILS_LENGTH = 10;
const MIN_WEEKLY_FOCUS_LENGTH = 3;
const PORTFOLIO_URL = "https://samuel-ojo.vercel.app";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "ForgeFlow AI";
const CREATOR_NAME = process.env.NEXT_PUBLIC_CREATOR_NAME ?? "Samuel Ojo";
type Theme = "light" | "dark";
type ActiveView = "generate" | "dashboard";

function clampNumber(value: number, min: number, max: number, fallback: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export default function GeneratorDashboard() {
  const [theme, setTheme] = useState<Theme>("light");
  const [activeView, setActiveView] = useState<ActiveView>("generate");
  const [companyDetails, setCompanyDetails] = useState("");
  const [weeklyFocus, setWeeklyFocus] = useState("");
  const [tone, setTone] = useState("Professional, sharp, strategic");
  const [postsPerDay, setPostsPerDay] = useState(1);
  const [numberOfDays, setNumberOfDays] = useState(7);
  const [callToAction, setCallToAction] = useState("Encourage consultation or meaningful engagement");
  const [targetAudience, setTargetAudience] = useState("Decision-makers and potential buyers");
  const [outputFileName, setOutputFileName] = useState("content-calendar");
  const [platforms, setPlatforms] = useState<Platform[]>(["LinkedIn", "Instagram"]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [healthLabel, setHealthLabel] = useState("Checking API");
  const [healthOk, setHealthOk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [history, setHistory] = useState<GenerationHistoryEvent[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadHealth() {
      try {
        const health = await checkHealth();
        if (!mounted) return;
        setHealthOk(health.status === "ok");
        setHealthLabel(health.app_name ? `${health.app_name} ready` : "API ready");
      } catch {
        if (!mounted) return;
        setHealthOk(false);
        setHealthLabel("API unavailable");
      }
    }

    void loadHealth();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(prefersDark ? "dark" : "light");
  }, []);

  const downloadHref = useMemo(() => {
    if (!result?.download_url) return "#";
    return buildDownloadUrl(result.download_url);
  }, [result]);

  const expectedRows = useMemo(() => {
    return platforms.length * postsPerDay * numberOfDays;
  }, [numberOfDays, platforms.length, postsPerDay]);

  function getValidationError() {
    if (companyDetails.trim().length < MIN_COMPANY_DETAILS_LENGTH) {
      return `Company details must be at least ${MIN_COMPANY_DETAILS_LENGTH} characters.`;
    }

    if (weeklyFocus.trim().length < MIN_WEEKLY_FOCUS_LENGTH) {
      return `Weekly focus must be at least ${MIN_WEEKLY_FOCUS_LENGTH} characters.`;
    }

    if (platforms.length === 0) {
      return "Select at least one platform.";
    }

    if (!outputFileName.trim()) {
      return "Add a file name for the Excel download.";
    }

    return null;
  }

  function togglePlatform(platform: Platform) {
    setPlatforms((current) => {
      if (current.includes(platform)) {
        return current.filter((item) => item !== platform);
      }
      return [...current, platform];
    });
  }

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
    if (activeView === "dashboard") {
      void loadHistory();
    }
  }, [activeView]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const validationError = getValidationError();
    if (validationError) {
      setError(validationError);
      return;
    }

    const safePostsPerDay = clampNumber(postsPerDay, 1, 5, 1);
    const safeNumberOfDays = clampNumber(numberOfDays, 1, 31, 7);
    setPostsPerDay(safePostsPerDay);
    setNumberOfDays(safeNumberOfDays);
    setIsSubmitting(true);

    try {
      const response = await generateCalendar({
        company_details: companyDetails.trim(),
        weekly_focus: weeklyFocus.trim(),
        tone: tone.trim(),
        platforms,
        posts_per_day: safePostsPerDay,
        number_of_days: safeNumberOfDays,
        call_to_action: callToAction.trim(),
        target_audience: targetAudience.trim(),
        output_file_name: outputFileName.trim(),
      });
      setResult(response);
      void loadHistory();
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Something went wrong while generating.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const records: CalendarRecord[] = result?.records ?? [];
  const summary = result?.platform_summary ?? {};
  const isDark = theme === "dark";
  const totalHistoryRows = history.reduce((total, item) => total + item.total_rows, 0);
  const recentHistory = history.slice(0, 6);

  return (
    <main className="page-shell" data-theme={theme}>
      <div className="ambient-grid" />
      <div className="motion-beam beam-one" />
      <div className="motion-beam beam-two" />

      <section className="app-header">
        <div className="header-main">
          <span className={`health-pill ${healthOk ? "ok" : "warn"}`}>{healthLabel}</span>
          <h1>{APP_NAME}</h1>
          <p className="header-copy">AI strategy, platform planning, and polished Excel delivery in one focused workspace.</p>
        </div>

        <div className="header-side">
          <AuthControls />
          <button
            className="theme-toggle"
            type="button"
            onClick={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
            aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
          >
            <span className="toggle-track">
              <span className="toggle-thumb" />
            </span>
            <span>{isDark ? "Light" : "Dark"}</span>
          </button>
          <div className="metric-card">
            <span className="metric-label">Expected rows</span>
            <strong>{expectedRows}</strong>
          </div>
          <div className="metric-card">
            <span className="metric-label">Generated rows</span>
            <strong>{result?.total_rows ?? 0}</strong>
          </div>
        </div>
      </section>

      <section className="intro-section">
        <div className="intro-copy">
          <span className="eyebrow">Content calendar engine</span>
          <h2>ForgeFlow turns a rough weekly idea into a structured publishing system.</h2>
          <p>
            Add the company context, choose the platforms, tune the audience and tone, then generate a calendar
            with platform counts, preview rows, and a formatted Excel workbook ready for delivery.
          </p>
        </div>

        <div className="flow-steps" aria-label="ForgeFlow workflow">
          <div className="flow-step">
            <span>01</span>
            <strong>Brief</strong>
            <p>Describe the brand, offer, and weekly focus.</p>
          </div>
          <div className="flow-step">
            <span>02</span>
            <strong>Tune</strong>
            <p>Set tone, audience, volume, platforms, and file name.</p>
          </div>
          <div className="flow-step">
            <span>03</span>
            <strong>Export</strong>
            <p>Preview the rows and download the styled workbook.</p>
          </div>
        </div>
      </section>

      <nav className="view-tabs" aria-label="ForgeFlow sections">
        <button
          className={activeView === "generate" ? "active" : ""}
          type="button"
          onClick={() => setActiveView("generate")}
        >
          Generate
        </button>
        <button
          className={activeView === "dashboard" ? "active" : ""}
          type="button"
          onClick={() => setActiveView("dashboard")}
        >
          Dashboard
        </button>
      </nav>

      {activeView === "generate" ? (
        <section className="dashboard-grid">
          <form className="panel form-panel" onSubmit={onSubmit}>
          <div className="panel-header">
            <h2>Generation studio</h2>
          </div>

          <label>
            <span>Company details</span>
            <textarea
              value={companyDetails}
              onChange={(event) => setCompanyDetails(event.target.value)}
              placeholder="Describe the company, offer, niche, goals, and positioning."
              rows={5}
            />
          </label>

          <label>
            <span>Weekly focus</span>
            <textarea
              value={weeklyFocus}
              onChange={(event) => setWeeklyFocus(event.target.value)}
              placeholder="What should this week focus on? Product education, authority, leads, launches, trust..."
              rows={3}
            />
          </label>

          <div className="two-col">
            <label>
              <span>Tone</span>
              <input value={tone} onChange={(event) => setTone(event.target.value)} placeholder="Professional, bold, premium" />
            </label>
            <label>
              <span>Target audience</span>
              <input
                value={targetAudience}
                onChange={(event) => setTargetAudience(event.target.value)}
                placeholder="Founders, marketers, manufacturers, buyers"
              />
            </label>
          </div>

          <div className="two-col">
            <label>
              <span>Posts per day</span>
              <input
                type="number"
                min={1}
                max={5}
                value={postsPerDay}
                onChange={(event) => setPostsPerDay(clampNumber(event.target.valueAsNumber, 1, 5, 1))}
              />
            </label>
            <label>
              <span>Number of days</span>
              <input
                type="number"
                min={1}
                max={31}
                value={numberOfDays}
                onChange={(event) => setNumberOfDays(clampNumber(event.target.valueAsNumber, 1, 31, 7))}
              />
            </label>
          </div>

          <label>
            <span>CTA style</span>
            <input
              value={callToAction}
              onChange={(event) => setCallToAction(event.target.value)}
              placeholder="Book a call, ask a question, request a demo"
            />
          </label>

          <label>
            <span>Excel file name</span>
            <input
              value={outputFileName}
              onChange={(event) => setOutputFileName(event.target.value)}
              placeholder="content-calendar"
            />
          </label>

          <div>
            <span className="field-label">Platforms</span>
            <div className="chip-grid">
              {AVAILABLE_PLATFORMS.map((platform) => {
                const active = platforms.includes(platform);
                return (
                  <button
                    key={platform}
                    type="button"
                    className={`chip ${active ? "active" : ""}`}
                    onClick={() => togglePlatform(platform)}
                  >
                    {platform}
                  </button>
                );
              })}
            </div>
          </div>

          {error ? <div className="error-box">{error}</div> : null}
          {result?.warning ? <div className="notice-box">{result.warning}</div> : null}

          <div className="action-row">
            <button className="primary-btn" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Generating..." : "Generate content calendar"}
            </button>
            <a
              className={`secondary-btn ${result?.download_url ? "" : "disabled"}`}
              href={result?.download_url ? downloadHref : undefined}
              target="_blank"
              rel="noreferrer"
              aria-disabled={!result?.download_url}
            >
              {result?.file_name ? `Download ${result.file_name}` : "Download Excel"}
            </a>
          </div>
          </form>

          <div className="side-stack">
            <section className="panel summary-panel">
            <div className="panel-header compact">
              <h2>Summary</h2>
            </div>
            <div className="summary-grid">
              {AVAILABLE_PLATFORMS.map((platform) => (
                <div key={platform} className="summary-card">
                  <span>{platform}</span>
                  <strong>{summary[platform] ?? 0}</strong>
                </div>
              ))}
            </div>
            </section>

            <section className="panel table-panel">
            <div className="panel-header compact">
              <h2>Generated calendar</h2>
            </div>
            <div className="table-wrap desktop-table">
              <table>
                <thead>
                  <tr>
                    <th>Day</th>
                    <th>Platform</th>
                    <th>Topic</th>
                    <th>Format</th>
                    <th>Hook</th>
                  </tr>
                </thead>
                <tbody>
                  {records.length > 0 ? (
                    records.map((record, index) => (
                      <tr key={`${record.Day}-${record.Platform}-${index}`}>
                        <td>{record.Day}</td>
                        <td>{record.Platform}</td>
                        <td>{record.Topic}</td>
                        <td>{record.Format}</td>
                        <td>{record.Hook}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="empty-cell">
                        No results yet. Generate a calendar to see rows here.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mobile-records">
              {records.length > 0 ? (
                records.map((record, index) => (
                  <article key={`${record.Day}-${record.Platform}-mobile-${index}`} className="mobile-record-card">
                    <div className="mobile-record-top">
                      <span className="mobile-record-day">{record.Day}</span>
                      <span className="mobile-record-platform">{record.Platform}</span>
                    </div>
                    <div className="mobile-record-body">
                      <div>
                        <span className="mobile-record-label">Topic</span>
                        <strong>{record.Topic}</strong>
                      </div>
                      <div>
                        <span className="mobile-record-label">Format</span>
                        <p>{record.Format}</p>
                      </div>
                      <div>
                        <span className="mobile-record-label">Hook</span>
                        <p>{record.Hook}</p>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="empty-cell mobile-empty">No results yet. Generate a calendar to see rows here.</div>
              )}
            </div>
            </section>
          </div>
        </section>
      ) : (
        <section className="history-dashboard">
          <div className="panel history-hero">
            <div>
              <span className="eyebrow">Usage dashboard</span>
              <h2>Your generation archive</h2>
              <p>Review previous calendars, track output volume, and download older Excel files from one place.</p>
            </div>
            <div className="history-stat-grid">
              <div className="metric-card">
                <span className="metric-label">Calendars</span>
                <strong>{history.length}</strong>
              </div>
              <div className="metric-card">
                <span className="metric-label">Rows generated</span>
                <strong>{totalHistoryRows}</strong>
              </div>
            </div>
          </div>

          <section className="panel history-list-panel">
            <div className="panel-header compact history-list-header">
              <div>
                <h2>Recent generations</h2>
                <p>Saved automatically after every successful generation.</p>
              </div>
              <button className="secondary-btn small-btn" type="button" onClick={() => void loadHistory()}>
                Refresh
              </button>
            </div>

            {historyError ? <div className="error-box">{historyError}</div> : null}
            {isHistoryLoading ? <div className="empty-cell mobile-empty">Loading dashboard history...</div> : null}

            {!isHistoryLoading && recentHistory.length === 0 && !historyError ? (
              <div className="empty-cell mobile-empty">No saved calendars yet. Generate one to start your archive.</div>
            ) : null}

            <div className="history-list">
              {recentHistory.map((item) => (
                <article className="history-card" key={item.id}>
                  <div className="history-card-main">
                    <div>
                      <span className="mobile-record-label">{formatHistoryDate(item.created_at)}</span>
                      <h3>{item.weekly_focus}</h3>
                      <p>{item.company_summary}</p>
                    </div>
                    <span className="history-mode">{item.generation_mode ?? "saved"}</span>
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
        </section>
      )}

      <footer className="app-footer">
        <span>Engineered for sharper content operations by </span>
        <a href={PORTFOLIO_URL} target="_blank" rel="noreferrer">
          {CREATOR_NAME}
        </a>
      </footer>
    </main>
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
