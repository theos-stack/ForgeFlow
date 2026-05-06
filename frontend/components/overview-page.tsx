"use client";

import Link from "next/link";
import OnboardingTour from "@/components/onboarding-tour";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "ForgeFlow AI";

const OVERVIEW_FEATURES = [
  {
    title: "Start with a real brief",
    description: "Tell us what matters: your offer, your audience, your angle, and the week you want to shape. We take it from there.",
  },
  {
    title: "Stay in one clean workspace",
    description: "We keep your brief, your live summary, and your calendar preview close together so you never lose your place.",
  },
  {
    title: "Leave with something usable",
    description: "When the calendar is ready, we hand it back in a structured Excel sheet that feels prepared for real work, not cleanup.",
  },
];

const PLAYBOOKS = [
  {
    title: "Authority week",
    description: "When you want to sound trusted and sharp, we can help you build around insight, proof, and perspective.",
    tag: "Thought leadership",
  },
  {
    title: "Offer push",
    description: "If this week is about one service or product, we can help you keep the message tight and the CTA clear.",
    tag: "Conversion",
  },
  {
    title: "Audience warming",
    description: "If your audience still needs confidence, we can help you lead with relevance, education, and lighter engagement.",
    tag: "Engagement",
  },
];

export default function OverviewPage() {
  return (
    <div className="page-stack page-enter">
      <OnboardingTour />

      <section className="hero-grid panel hero-panel">
        <div className="hero-copy">
          <span className="eyebrow-text">Welcome to ForgeFlow</span>
          <h3>We are ready to help you turn a rough idea into a clear content week.</h3>
          <p>
            This is your planning home base. Start here when you want the shape of the workflow, head into the studio when you are ready to build, and come back to the dashboard when you want to review what we have already generated with you.
          </p>
          <div className="hero-actions">
            <Link href="/generate" className="primary-btn">Open the studio</Link>
            <Link href="/dashboard" className="secondary-btn">Go to dashboard</Link>
            <OnboardingTour triggerOnly triggerLabel="Take the tour" />
          </div>
        </div>

        <div className="hero-side">
          <div className="hero-stat accent-card">
            <span className="metric-label">What we built for you</span>
            <strong>Less noise. Better flow. A calmer way to plan.</strong>
            <p>We stripped the clutter out so you can focus on the brief, keep the output in sight, and move forward without endless scrolling.</p>
          </div>
          <div className="hero-note-card">
            <span className="eyebrow-text">What to do next</span>
            <strong>See the shape, open the studio, then review your archive.</strong>
            <p>We have already mapped the path for you, so the app feels guided from the first click.</p>
          </div>
        </div>
      </section>

      <section className="panel compact-panel">
        <div className="section-heading">
          <span className="eyebrow-text">Why this feels better</span>
          <h3>We made ForgeFlow feel more like a focused workspace and less like a page you have to fight through.</h3>
          <p>Everything here is meant to keep you moving: clearer routes, tighter surfaces, and a stronger sense of what to do next.</p>
        </div>
        <div className="feature-grid">
          {OVERVIEW_FEATURES.map((item) => (
            <article key={item.title} className="feature-card">
              <span className="feature-chip">ForgeFlow</span>
              <h4>{item.title}</h4>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel compact-panel">
        <div className="section-heading">
          <span className="eyebrow-text">Quick playbooks</span>
          <h3>If you already know the kind of week you want, we can help you start with the right posture.</h3>
          <p>Pick the direction that feels closest, then carry it into the studio and let the brief do the rest.</p>
        </div>
        <div className="playbook-grid">
          {PLAYBOOKS.map((item) => (
            <article key={item.title} className="feature-card playbook-card">
              <span className="feature-chip">{item.tag}</span>
              <h4>{item.title}</h4>
              <p>{item.description}</p>
              <Link href="/generate" className="playbook-link">Use this in the studio</Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
