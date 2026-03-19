export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "";

export const ANALYTICS_EVENTS = {
  CTA_CLICK: "cta_click",
  REFERENCE_OPEN: "reference_open",
  NAV_CLICK: "nav_click",
  CONTACT_FORM_ATTEMPT: "contact_form_attempt",
  CONTACT_FORM_SUCCESS: "contact_form_success",
} as const;

type AnalyticsParams = Record<string, string | number | boolean | undefined>;
type GtagCommand = "js" | "config" | "event";
type Gtag = (command: GtagCommand, target: string | Date, params?: AnalyticsParams) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
    __gaInitialized?: string;
  }
}

const GA_SCRIPT_ID = "ga4-script";

export function isGaEnabled(): boolean {
  return Boolean(GA_MEASUREMENT_ID);
}

export function initGA(measurementId: string) {
  if (typeof window === "undefined" || !measurementId) {
    return;
  }

  if (!window.dataLayer) {
    window.dataLayer = [];
  }

  if (!window.gtag) {
    window.gtag = function gtag(command, target, params) {
      window.dataLayer?.push([command, target, params]);
    };
  }

  if (window.__gaInitialized === measurementId) {
    return;
  }

  if (!document.getElementById(GA_SCRIPT_ID)) {
    const script = document.createElement("script");
    script.id = GA_SCRIPT_ID;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    document.head.appendChild(script);
  }

  window.gtag("js", new Date());
  window.gtag("config", measurementId, {
    send_page_view: true,
  });
  window.__gaInitialized = measurementId;
}

export function trackEvent(name: string, params?: AnalyticsParams) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }

  window.gtag("event", name, params);
}
