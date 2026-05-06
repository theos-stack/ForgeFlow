"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

type OnboardingTourProps = {
  triggerLabel?: string;
  triggerOnly?: boolean;
};

type TourStep = {
  key: string;
  selector: string;
  eyebrow: string;
  title: string;
  description: string;
  placement?: "right" | "left" | "bottom" | "top";
  sidebarTarget?: boolean;
  alignTop?: boolean;
};

type TourPosition = {
  top: number;
  left: number;
  width: number;
  height: number;
  tooltipTop: number;
  tooltipLeft: number;
  tooltipPlacement: "right" | "left" | "bottom" | "top";
};

type PopoverSize = {
  width: number;
  height: number;
};

const TOUR_STORAGE_KEY = "forgeflow-tour-seen";
const DEFAULT_POPOVER_WIDTH = 400;
const DEFAULT_POPOVER_HEIGHT = 340;
const VIEWPORT_PADDING = 18;
const ACTIVE_TOUR_CLASS = "tour-target-active";
const ACTIVE_TOUR_ANCESTOR_CLASS = "tour-target-ancestor";
const PORTAL_ROOT_ID = "forgeflow-tour-root";

const TOUR_STEPS: TourStep[] = [
  {
    key: "overview",
    selector: '[data-tour="overview"]',
    eyebrow: "Overview",
    title: "Start here when you want the big picture",
    description: "Overview is your home base for a quick reset, a sense of direction, and a clean way into ForgeFlow before you start building.",
    placement: "right",
    sidebarTarget: true,
    alignTop: true,
  },
  {
    key: "generate",
    selector: '[data-tour="generate"]',
    eyebrow: "Generate",
    title: "Open this when you are ready to build the week",
    description: "Generate is where you set the brief, choose the platforms, and create the calendar while keeping the live summary and preview close.",
    placement: "right",
    sidebarTarget: true,
    alignTop: true,
  },
  {
    key: "dashboard",
    selector: '[data-tour="dashboard"]',
    eyebrow: "Dashboard",
    title: "Come here when you want your recent work",
    description: "Dashboard keeps your recent calendars close so you can review them, refresh your memory, and download a sheet again without starting over.",
    placement: "right",
    sidebarTarget: true,
    alignTop: true,
  },
  {
    key: "theme",
    selector: '[data-tour="theme"]',
    eyebrow: "Theme",
    title: "Switch between light and dark anytime",
    description: "Theme lets you move between light and dark whenever you want, and ForgeFlow remembers the mode that feels best for you.",
    placement: "bottom",
  },
  {
    key: "account",
    selector: '[data-tour="account"]',
    eyebrow: "Account",
    title: "Sign in or create your account here",
    description: "Account is where you sign in, create an account, or open your profile controls when you are already inside.",
    placement: "bottom",
  },
];

export default function OnboardingTour({ triggerLabel = "Take the tour", triggerOnly = false }: OnboardingTourProps) {
  const router = useRouter();
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const portalRootRef = useRef<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [position, setPosition] = useState<TourPosition | null>(null);
  const [popoverSize, setPopoverSize] = useState<PopoverSize>({ width: DEFAULT_POPOVER_WIDTH, height: DEFAULT_POPOVER_HEIGHT });

  useEffect(() => {
    if (typeof document === "undefined") return;

    let portalRoot = document.getElementById(PORTAL_ROOT_ID) as HTMLElement | null;
    let createdHere = false;

    if (!portalRoot) {
      portalRoot = document.createElement("div");
      portalRoot.id = PORTAL_ROOT_ID;
      document.body.appendChild(portalRoot);
      createdHere = true;
    }

    portalRootRef.current = portalRoot;
    setMounted(true);

    return () => {
      if (createdHere && portalRootRef.current?.parentNode) {
        portalRootRef.current.parentNode.removeChild(portalRootRef.current);
      }
      portalRootRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || triggerOnly) return;

    const hasSeenTour = window.localStorage.getItem(TOUR_STORAGE_KEY) === "true";
    if (hasSeenTour) return;

    const timer = window.setTimeout(() => {
      setStepIndex(0);
      setOpen(true);
    }, 420);

    return () => window.clearTimeout(timer);
  }, [triggerOnly]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.dispatchEvent(new CustomEvent("forgeflow-tour-active", { detail: { active: open } }));
    return () => {
      window.dispatchEvent(new CustomEvent("forgeflow-tour-active", { detail: { active: false } }));
    };
  }, [open]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const currentStep = TOUR_STEPS[stepIndex];
    if (open && currentStep?.sidebarTarget) {
      const shouldOpenSidebar = window.innerWidth <= 980;
      window.dispatchEvent(new CustomEvent("forgeflow-tour-sidebar", { detail: { open: shouldOpenSidebar } }));
    } else {
      window.dispatchEvent(new CustomEvent("forgeflow-tour-sidebar", { detail: { open: false } }));
    }
  }, [stepIndex, open]);

  useEffect(() => {
    if (!open || typeof window === "undefined") return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeTour();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const target = open ? (document.querySelector(TOUR_STEPS[stepIndex].selector) as HTMLElement | null) : null;
    if (!target) return;

    const elevatedAncestors: HTMLElement[] = [];
    let current = target.parentElement;

    while (current && current !== document.body) {
      current.classList.add(ACTIVE_TOUR_ANCESTOR_CLASS);
      elevatedAncestors.push(current);
      current = current.parentElement;
    }

    target.classList.add(ACTIVE_TOUR_CLASS);
    if (window.innerWidth <= 980) {
      target.scrollIntoView({ block: TOUR_STEPS[stepIndex].alignTop ? "start" : "nearest", inline: "nearest", behavior: "smooth" });
    }

    return () => {
      target.classList.remove(ACTIVE_TOUR_CLASS);
      elevatedAncestors.forEach((ancestor) => ancestor.classList.remove(ACTIVE_TOUR_ANCESTOR_CLASS));
    };
  }, [open, stepIndex]);

  useEffect(() => {
    if (!open || typeof window === "undefined") return;

    const measurePopover = () => {
      if (!popoverRef.current) return;
      const rect = popoverRef.current.getBoundingClientRect();
      const nextWidth = Math.ceil(rect.width) || DEFAULT_POPOVER_WIDTH;
      const nextHeight = Math.ceil(rect.height) || DEFAULT_POPOVER_HEIGHT;
      setPopoverSize((current) => (current.width === nextWidth && current.height === nextHeight ? current : { width: nextWidth, height: nextHeight }));
    };

    const frame = window.requestAnimationFrame(measurePopover);
    window.addEventListener("resize", measurePopover);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", measurePopover);
    };
  }, [open, stepIndex]);

  useEffect(() => {
    if (!open || typeof window === "undefined") return;

    const updatePosition = () => {
      const nextPosition = measureStep(TOUR_STEPS[stepIndex], popoverSize);
      setPosition(nextPosition);
    };

    const frame = window.requestAnimationFrame(updatePosition);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, stepIndex, popoverSize]);

  function markSeen() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(TOUR_STORAGE_KEY, "true");
    }
  }

  function clearTourClasses() {
    if (typeof window === "undefined") return;
    document.querySelectorAll(`.${ACTIVE_TOUR_CLASS}`).forEach((element) => element.classList.remove(ACTIVE_TOUR_CLASS));
    document.querySelectorAll(`.${ACTIVE_TOUR_ANCESTOR_CLASS}`).forEach((element) => element.classList.remove(ACTIVE_TOUR_ANCESTOR_CLASS));
  }

  function openTour() {
    setStepIndex(0);
    setOpen(true);
  }

  function closeTour() {
    markSeen();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("forgeflow-tour-sidebar", { detail: { open: false } }));
      clearTourClasses();
    }
    setOpen(false);
  }

  function nextStep() {
    if (stepIndex === TOUR_STEPS.length - 1) {
      markSeen();
      setOpen(false);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("forgeflow-tour-sidebar", { detail: { open: false } }));
        clearTourClasses();
      }
      router.push("/generate");
      return;
    }

    setStepIndex((current) => current + 1);
  }

  function previousStep() {
    setStepIndex((current) => Math.max(0, current - 1));
  }

  const overlay = open && position ? (
    <div className="tour-overlay" role="dialog" aria-modal="true" aria-labelledby="forgeflow-tour-title">
      <button type="button" className="tour-backdrop" aria-label="Close walkthrough" onClick={closeTour} />

      <div
        className="tour-spotlight"
        style={{
          top: position.top,
          left: position.left,
          width: position.width,
          height: position.height,
        }}
      />

      <div
        ref={popoverRef}
        className={`tour-popover ${position.tooltipPlacement}`}
        style={{ top: position.tooltipTop, left: position.tooltipLeft }}
      >
        <div className="tour-progress-row">
          <span className="eyebrow-text">Guided walkthrough</span>
          <span className="tour-step-count">{stepIndex + 1} / {TOUR_STEPS.length}</span>
        </div>

        <div className="tour-progress-bar" aria-hidden="true">
          <span style={{ width: `${((stepIndex + 1) / TOUR_STEPS.length) * 100}%` }} />
        </div>

        <div className="tour-copy compact-tour-copy">
          <span className="feature-chip">{TOUR_STEPS[stepIndex].eyebrow}</span>
          <h3 id="forgeflow-tour-title">{TOUR_STEPS[stepIndex].title}</h3>
          <p>{TOUR_STEPS[stepIndex].description}</p>
        </div>

        <div className="tour-actions">
          <button type="button" className="inline-link-btn" onClick={closeTour}>
            Skip for now
          </button>
          <div className="tour-action-group">
            <button type="button" className="secondary-btn tour-nav-btn" onClick={previousStep} disabled={stepIndex === 0}>
              Back
            </button>
            <button type="button" className="primary-btn tour-nav-btn" onClick={nextStep}>
              {stepIndex === TOUR_STEPS.length - 1 ? "Take me to the studio" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      {triggerOnly ? (
        <button type="button" className="secondary-btn tour-trigger" onClick={openTour}>
          {triggerLabel}
        </button>
      ) : null}
      {mounted && overlay && portalRootRef.current ? createPortal(overlay, portalRootRef.current) : null}
    </>
  );
}

function measureStep(step: TourStep, popoverSize: PopoverSize): TourPosition | null {
  if (typeof window === "undefined") return null;

  const element = document.querySelector(step.selector) as HTMLElement | null;
  if (!element) return null;

  const rect = element.getBoundingClientRect();
  const top = rect.top - 8;
  const left = rect.left - 8;
  const width = rect.width + 16;
  const height = rect.height + 16;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const tooltipWidth = Math.min(popoverSize.width || DEFAULT_POPOVER_WIDTH, viewportWidth - VIEWPORT_PADDING * 2);
  const tooltipHeight = Math.min(popoverSize.height || DEFAULT_POPOVER_HEIGHT, viewportHeight - VIEWPORT_PADDING * 2);
  const preferredPlacement = viewportWidth < 760 ? "bottom" : viewportWidth < 980 ? "bottom" : (step.placement ?? "right");

  let tooltipPlacement = preferredPlacement;
  let tooltipLeft = left + width + 20;
  let tooltipTop = rect.top;

  if (preferredPlacement === "right" && tooltipLeft + tooltipWidth > viewportWidth - VIEWPORT_PADDING) {
    tooltipPlacement = "bottom";
  }

  if (preferredPlacement === "left") {
    tooltipLeft = rect.left - tooltipWidth - 20;
    if (tooltipLeft < VIEWPORT_PADDING) {
      tooltipPlacement = "bottom";
    }
  }

  if (preferredPlacement === "bottom" || tooltipPlacement === "bottom") {
    tooltipLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
    tooltipTop = viewportWidth < 760 ? viewportHeight - tooltipHeight - 12 : rect.bottom + 18;
    tooltipPlacement = "bottom";

    if (viewportWidth >= 760 && tooltipTop + tooltipHeight > viewportHeight - VIEWPORT_PADDING) {
      tooltipPlacement = "top";
      tooltipTop = rect.top - tooltipHeight - 18;
    }
  }

  if (tooltipPlacement === "top") {
    tooltipLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
    tooltipTop = rect.top - tooltipHeight - 18;
    if (tooltipTop < VIEWPORT_PADDING) {
      tooltipPlacement = "bottom";
      tooltipTop = rect.bottom + 18;
    }
  }

  if (tooltipPlacement === "right") {
    tooltipTop = step.alignTop ? VIEWPORT_PADDING + 12 : rect.top + rect.height / 2 - tooltipHeight / 2;
  }

  if (tooltipPlacement === "left") {
    tooltipTop = step.alignTop ? VIEWPORT_PADDING + 12 : rect.top + rect.height / 2 - tooltipHeight / 2;
  }

  tooltipLeft = Math.max(VIEWPORT_PADDING, Math.min(tooltipLeft, viewportWidth - tooltipWidth - VIEWPORT_PADDING));
  tooltipTop = Math.max(VIEWPORT_PADDING, Math.min(tooltipTop, viewportHeight - tooltipHeight - VIEWPORT_PADDING));

  return {
    top,
    left,
    width,
    height,
    tooltipTop,
    tooltipLeft,
    tooltipPlacement,
  };
}




