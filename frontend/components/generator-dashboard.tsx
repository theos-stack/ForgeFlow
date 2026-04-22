"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { buildDownloadUrl, checkHealth, generateCalendar } from "@/lib/api";
import { CalendarRecord, GenerateResponse, Platform } from "@/lib/types";

const AVAILABLE_PLATFORMS: Platform[] = ["LinkedIn", "Instagram", "Twitter/X", "YouTube"];
const MIN_COMPANY_DETAILS_LENGTH = 10;
const MIN_WEEKLY_FOCUS_LENGTH = 3;

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "ForgeFlow AI";
const CREATOR_NAME = process.env.NEXT_PUBLIC_CREATOR_NAME ?? "Samuel Ojo";
const PORTFOLIO_URL = process.env.NEXT_PUBLIC_PORTFOLIO_URL ?? "#";
type Theme = "light" | "dark";

function clampNumber(value: number, min: number, max: number, fallback: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export default function GeneratorDashboard() {
  const [theme, setTheme] = useState<Theme>("light");
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

  return (
    <main className="page-shell" data-theme={theme}>
      <div className="ambient-grid" />
      <div className="motion-beam beam-one" />
      <div className="motion-beam beam-two" />

      <section className="app-header">
        <div>
          <span className={`health-pill ${healthOk ? "ok" : "warn"}`}>{healthLabel}</span>
          <h1>{APP_NAME}</h1>
          <p className="header-copy">AI strategy, platform planning, and polished Excel delivery in one focused workspace.</p>
        </div>

        <div className="header-side">
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
            <div className="table-wrap">
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
          </section>
        </div>
      </section>

      <footer className="app-footer">
        <span>Engineered for sharper content operations by </span>
        <a href={PORTFOLIO_URL} target="_blank" rel="noreferrer">
          {CREATOR_NAME}
        </a>
      </footer>
    </main>
  );
}
