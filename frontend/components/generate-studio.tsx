"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { buildDownloadUrl, generateCalendar } from "@/lib/api";
import { CalendarRecord, GenerateResponse, Platform } from "@/lib/types";

const AVAILABLE_PLATFORMS: Platform[] = ["LinkedIn", "Instagram", "Twitter/X", "YouTube"];
const MIN_COMPANY_DETAILS_LENGTH = 10;
const MIN_WEEKLY_FOCUS_LENGTH = 3;

const BRIEF_PRESETS = [
  {
    title: "Authority sprint",
    tone: "Professional, sharp, strategic",
    audience: "Decision-makers and potential buyers",
    cta: "Invite a strategy conversation or focused discovery call",
    platforms: ["LinkedIn", "Twitter/X"] as Platform[],
    weeklyFocus: "Build authority around one business problem, show a clear point of view, and move readers toward a higher-trust conversation.",
    summary: "Trust-first week.",
  },
  {
    title: "Offer campaign",
    tone: "Confident, clear, conversion-focused",
    audience: "Warm leads evaluating a service or solution",
    cta: "Encourage direct inquiries, bookings, or demo requests",
    platforms: ["LinkedIn", "Instagram", "YouTube"] as Platform[],
    weeklyFocus: "Focus the week around one offer, its outcomes, common objections, proof, and a stronger reason to act now.",
    summary: "Push one offer.",
  },
  {
    title: "Audience warming",
    tone: "Helpful, relevant, premium",
    audience: "Prospects who know the problem but need more confidence",
    cta: "Invite replies, saves, and low-friction engagement",
    platforms: ["Instagram", "Twitter/X"] as Platform[],
    weeklyFocus: "Use the week to deepen relevance with audience pain points, misconceptions, and practical education that earns attention.",
    summary: "Warm the room.",
  },
];

type MobileStudioView = "brief" | "summary" | "results";

function clampNumber(value: number, min: number, max: number, fallback: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export default function GenerateStudio() {
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
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileView, setMobileView] = useState<MobileStudioView>("brief");
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [mobileOptionsOpen, setMobileOptionsOpen] = useState(false);
  const presetsRef = useRef<HTMLDivElement | null>(null);

  const records: CalendarRecord[] = result?.records ?? [];
  const summary = result?.platform_summary ?? {};
  const expectedRows = useMemo(() => platforms.length * postsPerDay * numberOfDays, [numberOfDays, platforms.length, postsPerDay]);
  const downloadHref = useMemo(() => (result?.download_url ? buildDownloadUrl(result.download_url) : "#"), [result]);
  const briefScore = useMemo(() => {
    const checks = [
      companyDetails.trim().length >= MIN_COMPANY_DETAILS_LENGTH,
      weeklyFocus.trim().length >= MIN_WEEKLY_FOCUS_LENGTH,
      tone.trim().length > 0,
      targetAudience.trim().length > 0,
      callToAction.trim().length > 0,
      platforms.length > 0,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [callToAction, companyDetails, platforms.length, targetAudience, tone, weeklyFocus]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateViewport = () => setIsMobile(window.innerWidth <= 760);
    updateViewport();
    window.addEventListener("resize", updateViewport);

    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      setMobileView("brief");
      setPresetsOpen(false);
      setMobileOptionsOpen(false);
    }
  }, [isMobile]);

  useEffect(() => {
    if (!presetsOpen || !isMobile || typeof window === "undefined") return;

    const closeOnOutside = (event: MouseEvent | TouchEvent) => {
      if (!presetsRef.current) return;
      if (event.target instanceof Node && !presetsRef.current.contains(event.target)) {
        setPresetsOpen(false);
      }
    };

    window.addEventListener("mousedown", closeOnOutside);
    window.addEventListener("touchstart", closeOnOutside);

    return () => {
      window.removeEventListener("mousedown", closeOnOutside);
      window.removeEventListener("touchstart", closeOnOutside);
    };
  }, [isMobile, presetsOpen]);

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
    setPlatforms((current) => (current.includes(platform) ? current.filter((item) => item !== platform) : [...current, platform]));
  }

  function applyPreset(index: number) {
    const preset = BRIEF_PRESETS[index];
    setTone(preset.tone);
    setTargetAudience(preset.audience);
    setCallToAction(preset.cta);
    setPlatforms(preset.platforms);
    setWeeklyFocus((current) => (current.trim().length > 0 ? current : preset.weeklyFocus));
    if (isMobile) {
      setPresetsOpen(false);
      setMobileOptionsOpen(true);
    }
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
      if (isMobile) {
        setMobileView("results");
      }
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Something went wrong while generating.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const advancedFields = (
    <>
      <div className="two-col compact-two-col">
        <label>
          <span>Tone</span>
          <input value={tone} onChange={(event) => setTone(event.target.value)} placeholder="Professional, bold, premium" />
        </label>
        <label>
          <span>Audience</span>
          <input value={targetAudience} onChange={(event) => setTargetAudience(event.target.value)} placeholder="Founders, buyers, leads" />
        </label>
      </div>

      <div className="two-col compact-two-col">
        <label>
          <span>Posts/day</span>
          <input type="number" min={1} max={5} value={postsPerDay} onChange={(event) => setPostsPerDay(clampNumber(event.target.valueAsNumber, 1, 5, 1))} />
        </label>
        <label>
          <span>Days</span>
          <input type="number" min={1} max={31} value={numberOfDays} onChange={(event) => setNumberOfDays(clampNumber(event.target.valueAsNumber, 1, 31, 7))} />
        </label>
      </div>

      <div className="two-col compact-two-col">
        <label>
          <span>CTA</span>
          <input value={callToAction} onChange={(event) => setCallToAction(event.target.value)} placeholder="Book a call, ask a question" />
        </label>
        <label>
          <span>File name</span>
          <input value={outputFileName} onChange={(event) => setOutputFileName(event.target.value)} placeholder="content-calendar" />
        </label>
      </div>

      <div>
        <span className="field-label">Platforms</span>
        <div className="chip-grid compact-chip-grid">
          {AVAILABLE_PLATFORMS.map((platform) => {
            const active = platforms.includes(platform);
            return (
              <button key={platform} type="button" className={`chip ${active ? "active" : ""}`} onClick={() => togglePlatform(platform)}>
                {platform}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );

  const formPanel = (
    <form className="panel form-panel mobile-form-panel" onSubmit={onSubmit}>
      <div className="section-heading no-margin compact-section-row">
        <span className="eyebrow-text">Brief</span>
      </div>

      <label>
        <span>Company</span>
        <textarea
          value={companyDetails}
          onChange={(event) => setCompanyDetails(event.target.value)}
          placeholder="Company, offer, niche, goals."
          rows={4}
        />
      </label>

      <label>
        <span>Week focus</span>
        <textarea
          value={weeklyFocus}
          onChange={(event) => setWeeklyFocus(event.target.value)}
          placeholder="What should this week do?"
          rows={3}
        />
      </label>

      {isMobile ? (
        <div className="mobile-accordion-group">
          <button type="button" className="mobile-accordion-trigger" onClick={() => setMobileOptionsOpen((current) => !current)}>
            <span>More options</span>
            <span>{mobileOptionsOpen ? "-" : "+"}</span>
          </button>
          {mobileOptionsOpen ? <div className="mobile-accordion-panel">{advancedFields}</div> : null}
        </div>
      ) : advancedFields}

      {error ? <div className="error-box">{error}</div> : null}
      {result?.warning ? <div className="notice-box">{result.warning}</div> : null}

      <div className="action-row compact-action-row mobile-action-row">
        <button className="primary-btn" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Generating..." : "Generate"}
        </button>
        {isMobile ? (
          <button className="secondary-btn" type="button" onClick={() => setMobileView("summary")}>
            View summary
          </button>
        ) : (
          <a className={`secondary-btn ${result?.download_url ? "" : "disabled"}`} href={result?.download_url ? downloadHref : undefined} target="_blank" rel="noreferrer" aria-disabled={!result?.download_url}>
            {result?.file_name ? `Download ${result.file_name}` : "Download"}
          </a>
        )}
      </div>
    </form>
  );

  const summaryPanel = (
    <section className="panel summary-panel compact-summary-panel mobile-summary-panel">
      <div className="section-heading no-margin compact-section-row section-row">
        <div>
          <span className="eyebrow-text">Summary</span>
          <h3>{briefScore}% ready</h3>
        </div>
        {isMobile ? (
          <button className="secondary-btn small-btn" type="button" onClick={() => setMobileView("brief")}>Edit brief</button>
        ) : null}
      </div>
      <div className="metric-grid compact-grid compact-summary-grid">
        <div className="metric-card small-metric accent-metric">
          <span className="metric-label">Score</span>
          <strong>{briefScore}%</strong>
        </div>
        <div className="metric-card small-metric">
          <span className="metric-label">Rows</span>
          <strong>{result?.total_rows ?? 0}</strong>
        </div>
        <div className="metric-card small-metric">
          <span className="metric-label">Planned</span>
          <strong>{expectedRows}</strong>
        </div>
        {AVAILABLE_PLATFORMS.map((platform) => (
          <div key={platform} className="summary-card concise-card compact-platform-card">
            <span>{platform}</span>
            <strong>{summary[platform] ?? 0}</strong>
          </div>
        ))}
      </div>
      {isMobile ? (
        <div className="mobile-view-actions">
          <button className="primary-btn" type="button" onClick={() => setMobileView("results")}>
            View results
          </button>
        </div>
      ) : null}
    </section>
  );

  const resultsPanel = (
    <section className="panel table-panel compact-table-panel mobile-results-panel">
      <div className="section-heading no-margin section-row compact-section-row">
        <div>
          <span className="eyebrow-text">Results</span>
          <h3>{records.length ? "Ready" : "Waiting"}</h3>
        </div>
        <span className="status-pill neutral">{records.length ? `${records.length} rows` : "No rows yet"}</span>
      </div>

      {isMobile && result?.download_url ? (
        <div className="mobile-view-actions">
          <a className="primary-btn" href={downloadHref} target="_blank" rel="noreferrer">
            Download {result.file_name}
          </a>
        </div>
      ) : null}

      <div className="preview-surface">
        <div className="table-wrap fixed-preview desktop-table">
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
                  <td colSpan={5} className="empty-cell">Generate to fill this table.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mobile-records">
          {records.length > 0 ? (
            records.map((record, index) => (
              <article key={`${record.Day}-${record.Platform}-mobile-${index}`} className="mobile-record-card compact-mobile-record-card">
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
            <div className="empty-cell mobile-empty">Generate to see results.</div>
          )}
        </div>
      </div>

      {isMobile ? (
        <div className="mobile-view-actions split-mobile-actions">
          <button className="secondary-btn" type="button" onClick={() => setMobileView("brief")}>Back to brief</button>
          <button className="secondary-btn" type="button" onClick={() => setMobileView("summary")}>Open summary</button>
        </div>
      ) : null}
    </section>
  );

  if (isMobile) {
    return (
      <div className="page-stack page-enter app-dense-stack mobile-studio-shell">
        <section className="panel compact-panel studio-compact-header mobile-studio-header">
          <div className="section-heading no-margin section-row compact-section-row">
            <div>
              <span className="eyebrow-text">Studio</span>
              <h3>Build your week</h3>
            </div>
            <span className="status-pill neutral">{expectedRows} planned</span>
          </div>
        </section>

        <div className="mobile-studio-tabs">
          <button type="button" className={`mobile-tab-btn ${mobileView === "brief" ? "active" : ""}`} onClick={() => setMobileView("brief")}>Brief</button>
          <button type="button" className={`mobile-tab-btn ${mobileView === "summary" ? "active" : ""}`} onClick={() => setMobileView("summary")}>Summary</button>
          <button type="button" className={`mobile-tab-btn ${mobileView === "results" ? "active" : ""}`} onClick={() => setMobileView("results")}>Results</button>
        </div>

        {mobileView === "brief" ? (
          <>
            <section className="panel compact-panel mobile-presets-shell" ref={presetsRef}>
              <button type="button" className="mobile-accordion-trigger presets-trigger" onClick={() => setPresetsOpen((current) => !current)}>
                <span>Quick presets</span>
                <span>{presetsOpen ? "-" : "+"}</span>
              </button>
              {presetsOpen ? (
                <div className="mobile-accordion-panel mobile-preset-list">
                  {BRIEF_PRESETS.map((preset, index) => (
                    <button key={preset.title} type="button" className="feature-card preset-card compact-preset-card" onClick={() => applyPreset(index)}>
                      <span className="feature-chip">Preset</span>
                      <h4>{preset.title}</h4>
                      <p>{preset.summary}</p>
                    </button>
                  ))}
                </div>
              ) : null}
            </section>
            {formPanel}
          </>
        ) : null}

        {mobileView === "summary" ? summaryPanel : null}
        {mobileView === "results" ? resultsPanel : null}
      </div>
    );
  }

  return (
    <div className="page-stack page-enter app-dense-stack">
      <section className="panel compact-panel studio-compact-header">
        <div className="section-heading no-margin section-row compact-section-row">
          <div>
            <span className="eyebrow-text">Studio</span>
            <h3>Build your week</h3>
          </div>
          <span className="status-pill neutral">{expectedRows} planned</span>
        </div>
      </section>

      <section className="panel compact-panel compact-presets-panel">
        <div className="section-heading no-margin compact-section-row">
          <span className="eyebrow-text">Quick presets</span>
        </div>
        <div className="playbook-grid presets-grid compact-presets-grid">
          {BRIEF_PRESETS.map((preset, index) => (
            <button key={preset.title} type="button" className="feature-card preset-card compact-preset-card" onClick={() => applyPreset(index)}>
              <span className="feature-chip">Preset</span>
              <h4>{preset.title}</h4>
              <p>{preset.summary}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="studio-grid compact-studio-grid">
        {formPanel}
        <div className="studio-side-stack compact-side-stack">{summaryPanel}</div>
      </section>

      {resultsPanel}
    </div>
  );
}
