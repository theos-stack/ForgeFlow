"use client";

import Link from "next/link";
import OnboardingTour from "@/components/onboarding-tour";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "ForgeFlow AI";

const QUICK_ROUTES = [
  {
    title: "Open studio",
    description: "Build this week.",
    href: "/generate",
    action: "Generate",
  },
  {
    title: "Open dashboard",
    description: "Check recent runs.",
    href: "/dashboard",
    action: "Archive",
  },
  {
    title: "Take the tour",
    description: "See the main controls.",
    action: "Walkthrough",
    tour: true,
  },
];

const PLAYBOOKS = [
  { title: "Authority", description: "Lead with proof and perspective.", tag: "Trust" },
  { title: "Offer", description: "Push one offer with a clear CTA.", tag: "Conversion" },
  { title: "Warm-up", description: "Teach, relate, and earn attention.", tag: "Engagement" },
];

export default function OverviewPage() {
  return (
    <div className="page-stack page-enter app-dense-stack">
      <OnboardingTour />

      <section className="hero-grid panel hero-panel compact-hero-panel">
        <div className="hero-copy compact-hero-copy">
          <span className="eyebrow-text">Welcome</span>
          <h3>{APP_NAME}</h3>
          <p>Plan faster, generate clean calendars, and export without the extra noise.</p>
          <div className="hero-actions compact-hero-actions">
            <Link href="/generate" className="primary-btn">Open studio</Link>
            <Link href="/dashboard" className="secondary-btn">Open dashboard</Link>
          </div>
        </div>

        <div className="hero-side compact-hero-side">
          <div className="hero-stat accent-card compact-hero-stat">
            <span className="metric-label">Flow</span>
            <strong>Brief. Generate. Export.</strong>
          </div>
          <div className="hero-stat compact-hero-stat">
            <span className="metric-label">Built for content teams</span>
            <strong>One brief. One clear calendar.</strong>
          </div>
        </div>
      </section>

      <section className="quick-nav-grid">
        {QUICK_ROUTES.map((item) => (
          item.tour ? (
            <div key={item.title} className="feature-card route-card compact-route-card">
              <span className="feature-chip">Guide</span>
              <h4>{item.title}</h4>
              <p>{item.description}</p>
              <OnboardingTour triggerOnly triggerLabel={item.action} />
            </div>
          ) : (
            <Link key={item.title} href={item.href ?? "/"} className="feature-card route-card compact-route-card">
              <span className="feature-chip">Open</span>
              <h4>{item.title}</h4>
              <p>{item.description}</p>
              <span className="playbook-link">{item.action}</span>
            </Link>
          )
        ))}
      </section>

      <section className="quick-playbook-grid">
        {PLAYBOOKS.map((item) => (
          <article key={item.title} className="feature-card playbook-card compact-playbook-card">
            <span className="feature-chip">{item.tag}</span>
            <h4>{item.title}</h4>
            <p>{item.description}</p>
          </article>
        ))}
      </section>
    </div>
  );
}

