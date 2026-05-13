"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PropsWithChildren, useEffect, useMemo, useState } from "react";
import AuthControls from "@/components/auth-controls";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "ForgeFlow AI";
const PORTFOLIO_URL = "https://samuel-ojo.vercel.app";
const NAV_ITEMS = [
  { href: "/", label: "Overview", kicker: "Home", icon: "OV", tourId: "overview" },
  { href: "/generate", label: "Generate", kicker: "Studio", icon: "GN", tourId: "generate" },
  { href: "/dashboard", label: "Dashboard", kicker: "Archive", icon: "DB", tourId: "dashboard" },
] as const;

type Theme = "light" | "dark";

export default function AppShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<Theme>("dark");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tourActive, setTourActive] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedTheme = window.localStorage.getItem("forgeflow-theme");
    if (storedTheme === "light" || storedTheme === "dark") {
      setTheme(storedTheme);
      document.documentElement.dataset.theme = storedTheme;
      return;
    }

    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextTheme: Theme = prefersDark ? "dark" : "light";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    if (typeof window !== "undefined") {
      window.localStorage.setItem("forgeflow-theme", theme);
    }
  }, [theme]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen || typeof window === "undefined") return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleTourSidebar = (event: Event) => {
      const detail = (event as CustomEvent<{ open: boolean }>).detail;
      setMobileOpen(Boolean(detail?.open));
    };

    const handleTourActive = (event: Event) => {
      const detail = (event as CustomEvent<{ active: boolean }>).detail;
      setTourActive(Boolean(detail?.active));
    };

    window.addEventListener("forgeflow-tour-sidebar", handleTourSidebar as EventListener);
    window.addEventListener("forgeflow-tour-active", handleTourActive as EventListener);

    return () => {
      window.removeEventListener("forgeflow-tour-sidebar", handleTourSidebar as EventListener);
      window.removeEventListener("forgeflow-tour-active", handleTourActive as EventListener);
    };
  }, []);

  const pageMeta = useMemo(() => {
    return (
      NAV_ITEMS.find((item) => item.href === pathname) ??
      NAV_ITEMS.find((item) => item.href !== "/" && pathname.startsWith(item.href)) ??
      NAV_ITEMS[0]
    );
  }, [pathname]);

  return (
    <div className="app-shell compact-app-shell">
      <button
        type="button"
        className={`app-sidebar-backdrop ${mobileOpen ? "is-visible" : ""}`}
        aria-label="Close menu"
        onClick={() => setMobileOpen(false)}
      />

      <aside className={`app-sidebar compact-sidebar ${mobileOpen ? "is-open" : ""} ${tourActive ? "tour-elevated" : ""}`}>
        <div className="brand-card compact-brand-card">
          <div className="brand-mark">FF</div>
          <div className="brand-copy compact-brand-copy">
            <span className="eyebrow-text">ForgeFlow</span>
            <h1>{APP_NAME}</h1>
            <p>Plan. Generate. Export.</p>
          </div>
        </div>

        <nav className="sidebar-nav compact-sidebar-nav" aria-label="Primary">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link key={item.href} href={item.href} className={`nav-link ${isActive ? "active" : ""}`} data-tour={item.tourId}>
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-copy">
                  <span className="nav-label">{item.label}</span>
                  <span className="nav-kicker">{item.kicker}</span>
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="shell-main-column compact-main-column">
        <header className="topbar compact-topbar desktop-topbar">
          <div className="topbar-main">
            <div>
              <span className="eyebrow-text">{pageMeta.kicker}</span>
              <h2>{pageMeta.label}</h2>
            </div>
          </div>

          <div className="topbar-actions compact-topbar-actions">
            <button
              className="theme-toggle"
              type="button"
              data-tour="theme"
              onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            >
              <span className="toggle-track">
                <span className="toggle-thumb" />
              </span>
              <span>{theme === "dark" ? "Light" : "Dark"}</span>
            </button>
            <div data-tour="account">
              <AuthControls />
            </div>
          </div>
        </header>

        <header className="mobile-topbar">
          <div className="mobile-topbar-left" data-tour="account">
            <AuthControls compact />
          </div>
          <div className="mobile-topbar-center">
            <span className="mobile-topbar-title">{pageMeta.label}</span>
            <button
              className="theme-toggle compact-theme-toggle"
              type="button"
              data-tour="theme"
              onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            >
              <span className="toggle-track">
                <span className="toggle-thumb" />
              </span>
              <span className="compact-theme-label">{theme === "dark" ? "Light" : "Dark"}</span>
            </button>
          </div>
          <button type="button" className="hamburger-btn" onClick={() => setMobileOpen((current) => !current)} aria-label={mobileOpen ? "Close menu" : "Open menu"}>
            <span />
            <span />
            <span />
          </button>
        </header>

        <main className="page-content compact-page-content">{children}</main>

        <footer className="app-footer compact-app-footer">
          <span>Built with intention by </span>
          <a href={PORTFOLIO_URL} target="_blank" rel="noreferrer">Samuel Ojo</a>
        </footer>
      </div>
    </div>
  );
}
