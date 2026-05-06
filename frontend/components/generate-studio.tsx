"use client";

import { FormEvent, useMemo, useState } from "react";
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
  },
  {
    title: "Offer campaign",
    tone: "Confident, clear, conversion-focused",
    audience: "Warm leads evaluating a service or solution",
    cta: "Encourage direct inquiries, bookings, or demo requests",
    platforms: ["LinkedIn", "Instagram", "YouTube"] as Platform[],
    weeklyFocus: "Focus the week around one offer, its outcomes, common objections, proof, and a stronger reason to act now.",
  },
  {
    title: "Audience warming",
    tone: "Helpful, relevant, premium",
    audience: "Prospects who know the problem but need more confidence",
    cta: "Invite replies, saves, and low-friction engagement",
    platforms: ["Instagram", "Twitter/X"] as Platform[],
    weeklyFocus: "Use the week to deepen relevance with audience pain points, misconceptions, and practical education that earns attention.",
  },
];

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

  return (
    <div className="page-stack page-enter">
      <section className="panel compact-panel studio-intro">
        <div className="section-heading no-margin">
          <span className="eyebrow-text">Generation studio</span>
          <h3>We are ready when you are. Give us the brief, and we will help you shape the week.</h3>
          <p>Everything here is arranged to keep you steady: the inputs stay close, the summary stays live, and your calendar shows up without sending you somewhere else.</p>
        </div>
      </section>

      <section className="panel compact-panel">
        <div className="section-heading no-margin">
          <span className="eyebrow-text">Quick presets</span>
          <h3>Want a faster start? Pick the campaign angle that feels closest.</h3>
        </div>
        <div className="playbook-grid presets-grid">
          {BRIEF_PRESETS.map((preset, index) => (
            <button key={preset.title} type="button" className="feature-card preset-card" onClick={() => applyPreset(index)}>
              <span className="feature-chip">Preset</span>
              <h4>{preset.title}</h4>
              <p>{preset.weeklyFocus}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="studio-grid">
        <form className="panel form-panel" onSubmit={onSubmit}>
          <div className="section-heading no-margin">
            <span className="eyebrow-text">Company brief</span>
            <h3>Tell us what we should hold onto before we generate.</h3>
          </div>

          <label>
            <span>Company details</span>
            <textarea
              value={companyDetails}
              onChange={(event) => setCompanyDetails(event.target.value)}
              placeholder="Tell us about the company, the offer, the niche, the goals, and the positioning."
              rows={5}
            />
          </label>

          <label>
            <span>Weekly focus</span>
            <textarea
              value={weeklyFocus}
              onChange={(event) => setWeeklyFocus(event.target.value)}
              placeholder="What should this week do for you? Build authority, warm leads, push an offer, earn trust..."
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
              <input value={targetAudience} onChange={(event) => setTargetAudience(event.target.value)} placeholder="Founders, marketers, manufacturers, buyers" />
            </label>
          </div>

          <div className="two-col">
            <label>
              <span>Posts per day</span>
              <input type="number" min={1} max={5} value={postsPerDay} onChange={(event) => setPostsPerDay(clampNumber(event.target.valueAsNumber, 1, 5, 1))} />
            </label>
            <label>
              <span>Number of days</span>
              <input type="number" min={1} max={31} value={numberOfDays} onChange={(event) => setNumberOfDays(clampNumber(event.target.valueAsNumber, 1, 31, 7))} />
            </label>
          </div>

          <div className="two-col">
            <label>
              <span>CTA style</span>
              <input value={callToAction} onChange={(event) => setCallToAction(event.target.value)} placeholder="Book a call, ask a question, request a demo" />
            </label>
            <label>
              <span>Excel file name</span>
              <input value={outputFileName} onChange={(event) => setOutputFileName(event.target.value)} placeholder="content-calendar" />
            </label>
          </div>

          <div>
            <span className="field-label">Platforms</span>
            <div className="chip-grid">
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

          {error ? <div className="error-box">{error}</div> : null}
          {result?.warning ? <div className="notice-box">{result.warning}</div> : null}

          <div className="action-row">
            <button className="primary-btn" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Generating..." : "Generate content calendar"}
            </button>
            <a className={`secondary-btn ${result?.download_url ? "" : "disabled"}`} href={result?.download_url ? downloadHref : undefined} target="_blank" rel="noreferrer" aria-disabled={!result?.download_url}>
              {result?.file_name ? `Download ${result.file_name}` : "Download Excel"}
            </a>
          </div>
        </form>

        <div className="studio-side-stack">
          <section className="panel summary-panel">
            <div className="section-heading no-margin">
              <span className="eyebrow-text">Live summary</span>
              <h3>We will keep the shape of the output in view while you work.</h3>
            </div>
            <div className="metric-grid compact-grid">
              <div className="metric-card small-metric accent-metric">
                <span className="metric-label">Brief score</span>
                <strong>{briefScore}%</strong>
              </div>
              <div className="metric-card small-metric">
                <span className="metric-label">Expected rows</span>
                <strong>{expectedRows}</strong>
              </div>
              <div className="metric-card small-metric">
                <span className="metric-label">Generated rows</span>
                <strong>{result?.total_rows ?? 0}</strong>
              </div>
              {AVAILABLE_PLATFORMS.map((platform) => (
                <div key={platform} className="summary-card concise-card">
                  <span>{platform}</span>
                  <strong>{summary[platform] ?? 0}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="panel checklist-panel">
            <div className="section-heading no-margin">
              <span className="eyebrow-text">Quality signal</span>
              <h3>A few details help us give you better output.</h3>
            </div>
            <ul className="checklist-list">
              <li>Tell us clearly what the business does and who it serves.</li>
              <li>Anchor the week around one strong campaign direction.</li>
              <li>Set the tone, CTA, and audience before you generate.</li>
              <li>Use a preset if you want a faster strategic starting point.</li>
            </ul>
          </section>
        </div>
      </section>

      <section className="panel table-panel">
        <div className="section-heading no-margin section-row">
          <div>
            <span className="eyebrow-text">Generated calendar</span>
            <h3>Your calendar will show up here the moment it is ready.</h3>
          </div>
          <span className="status-pill neutral">{records.length ? `${records.length} rows` : "Waiting for your brief"}</span>
        </div>

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
                    <td colSpan={5} className="empty-cell">Nothing yet. Give us the brief and we will fill this table for you.</td>
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
              <div className="empty-cell mobile-empty">Nothing yet. Give us the brief and we will fill this table for you.</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
