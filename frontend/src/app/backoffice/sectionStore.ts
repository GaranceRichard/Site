import type { BackofficeSection } from "./types";

const SECTION_KEY = "backoffice_section";
const sectionListeners = new Set<() => void>();

function normalizeSection(value: string | null): BackofficeSection {
  if (value === "messages" || value === "references" || value === "stats" || value === "settings") {
    return value;
  }
  return "messages";
}

export function getBackofficeSection(): BackofficeSection {
  if (typeof window === "undefined") {
    return "messages";
  }
  try {
    return normalizeSection(window.localStorage.getItem(SECTION_KEY));
  } catch {
    return "messages";
  }
}

export function getBackofficeSectionServer(): BackofficeSection {
  return "messages";
}

export function setBackofficeSection(next: BackofficeSection) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(SECTION_KEY, next);
  } catch {
    // ignore storage errors
  }
  for (const listener of sectionListeners) {
    listener();
  }
}

export function subscribeBackofficeSection(listener: () => void) {
  sectionListeners.add(listener);
  return () => {
    sectionListeners.delete(listener);
  };
}
