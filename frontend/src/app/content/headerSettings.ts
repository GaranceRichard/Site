"use client";

export type HeaderSettings = {
  name: string;
  title: string;
  bookingUrl: string;
};

export const DEFAULT_HEADER_SETTINGS: HeaderSettings = {
  name: "Garance Richard",
  title: "Coach Lean-Agile",
  bookingUrl: "https://calendar.app.google/hYgX38RpfWiu65Vh8",
};

const HEADER_SETTINGS_KEY = "site_header_settings";
const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cachedValue: HeaderSettings = DEFAULT_HEADER_SETTINGS;

function normalizeHeaderSettings(value: unknown): HeaderSettings {
  if (!value || typeof value !== "object") {
    return DEFAULT_HEADER_SETTINGS;
  }

  const candidate = value as Partial<HeaderSettings>;
  const name = typeof candidate.name === "string" ? candidate.name.trim() : "";
  const title = typeof candidate.title === "string" ? candidate.title.trim() : "";
  const bookingUrl =
    typeof candidate.bookingUrl === "string" ? candidate.bookingUrl.trim() : "";

  return {
    name: name || DEFAULT_HEADER_SETTINGS.name,
    title: title || DEFAULT_HEADER_SETTINGS.title,
    bookingUrl: bookingUrl || DEFAULT_HEADER_SETTINGS.bookingUrl,
  };
}

export function getHeaderSettings(): HeaderSettings {
  if (typeof window === "undefined") {
    return DEFAULT_HEADER_SETTINGS;
  }

  try {
    const raw = window.localStorage.getItem(HEADER_SETTINGS_KEY);
    if (raw === cachedRaw) {
      return cachedValue;
    }

    if (!raw) {
      cachedRaw = raw;
      cachedValue = DEFAULT_HEADER_SETTINGS;
      return cachedValue;
    }

    cachedRaw = raw;
    cachedValue = normalizeHeaderSettings(JSON.parse(raw));
    return cachedValue;
  } catch {
    return DEFAULT_HEADER_SETTINGS;
  }
}

export function getHeaderSettingsServer(): HeaderSettings {
  return DEFAULT_HEADER_SETTINGS;
}

export function setHeaderSettings(next: HeaderSettings) {
  if (typeof window === "undefined") {
    return;
  }

  const normalized = normalizeHeaderSettings(next);
  const serialized = JSON.stringify(normalized);

  cachedValue = normalized;
  cachedRaw = serialized;
  try {
    window.localStorage.setItem(HEADER_SETTINGS_KEY, serialized);
  } catch {
    // ignore storage errors
  }

  for (const listener of listeners) {
    listener();
  }
}

export function subscribeHeaderSettings(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
