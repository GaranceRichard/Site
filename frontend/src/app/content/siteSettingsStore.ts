"use client";

import { resolveApiBaseUrl } from "../lib/backoffice";

export type HeaderSettings = {
  name: string;
  title: string;
  bookingUrl: string;
};

export type HeroLinkTarget =
  | "promise"
  | "about"
  | "services"
  | "method"
  | "references"
  | "message";

export type HeroSectionLink = {
  id: HeroLinkTarget;
  label: string;
  enabled: boolean;
};

export type HeroCard = {
  id: string;
  title: string;
  content: string;
};

export type HomeHeroSettings = {
  eyebrow: string;
  title: string;
  subtitle: string;
  links: HeroSectionLink[];
  keywords: string[];
  cards: HeroCard[];
};

export type SiteSettings = {
  header: HeaderSettings;
  homeHero: HomeHeroSettings;
};

export const DEFAULT_HEADER_SETTINGS: HeaderSettings = {
  name: "Garance Richard",
  title: "Coach Lean-Agile",
  bookingUrl: "https://calendar.app.google/hYgX38RpfWiu65Vh8",
};

const DEFAULT_LINKS: HeroSectionLink[] = [
  { id: "services", label: "Voir les offres", enabled: true },
  { id: "references", label: "Exemples d'impact", enabled: true },
  { id: "promise", label: "Promesse", enabled: false },
  { id: "about", label: "A propos", enabled: false },
  { id: "method", label: "Methode", enabled: false },
  { id: "message", label: "Message", enabled: false },
];

const DEFAULT_CARDS: HeroCard[] = [
  {
    id: "card-1",
    title: "Cadre d'intervention",
    content: "Diagnostic court -> 2-3 leviers -> routines utiles -> stabilisation -> transfert.\n\nConcret - Mesurable - Durable",
  },
  {
    id: "card-2",
    title: "Ce que vous obtenez",
    content: "- Une priorite explicite\n- Un flux plus stable\n- Une cadence soutenable",
  },
];

export const DEFAULT_HOME_HERO_SETTINGS: HomeHeroSettings = {
  eyebrow: "Lean-Agile - transformation pragmatique, ancree dans le reel",
  title: "Des equipes plus sereines.\nDes livraisons plus fiables.",
  subtitle:
    "Accompagnement oriente resultats : clarifier la priorite, stabiliser le flux, renforcer l autonomie - sans surcouche inutile.",
  links: DEFAULT_LINKS,
  keywords: ["Clarte", "Flux", "Ancrage"],
  cards: DEFAULT_CARDS,
};

const DEFAULT_SITE_SETTINGS: SiteSettings = {
  header: DEFAULT_HEADER_SETTINGS,
  homeHero: DEFAULT_HOME_HERO_SETTINGS,
};

const listeners = new Set<() => void>();
let cachedValue: SiteSettings = DEFAULT_SITE_SETTINGS;
let hasLoaded = false;
let pendingLoad: Promise<SiteSettings> | null = null;

function notifyListeners() {
  for (const listener of listeners) {
    listener();
  }
}

function normalizeHeaderSettings(value: unknown): HeaderSettings {
  if (!value || typeof value !== "object") {
    return DEFAULT_HEADER_SETTINGS;
  }

  const candidate = value as Partial<HeaderSettings>;
  const name = typeof candidate.name === "string" ? candidate.name.trim() : "";
  const title = typeof candidate.title === "string" ? candidate.title.trim() : "";
  const bookingUrl = typeof candidate.bookingUrl === "string" ? candidate.bookingUrl.trim() : "";

  return {
    name: name || DEFAULT_HEADER_SETTINGS.name,
    title: title || DEFAULT_HEADER_SETTINGS.title,
    bookingUrl: bookingUrl || DEFAULT_HEADER_SETTINGS.bookingUrl,
  };
}

function normalizeLinks(value: unknown): HeroSectionLink[] {
  const list = Array.isArray(value) ? value : [];
  const mapById = new Map<HeroLinkTarget, HeroSectionLink>();
  const orderedIds: HeroLinkTarget[] = [];

  for (const item of list) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const candidate = item as Partial<HeroSectionLink>;
    if (
      candidate.id !== "promise" &&
      candidate.id !== "about" &&
      candidate.id !== "services" &&
      candidate.id !== "method" &&
      candidate.id !== "references" &&
      candidate.id !== "message"
    ) {
      continue;
    }

    if (!mapById.has(candidate.id)) {
      orderedIds.push(candidate.id);
    }

    mapById.set(candidate.id, {
      id: candidate.id,
      label: typeof candidate.label === "string" ? candidate.label.trim() : "",
      enabled: Boolean(candidate.enabled),
    });
  }

  const defaultsById = new Map<HeroLinkTarget, HeroSectionLink>(
    DEFAULT_LINKS.map((link) => [link.id, link]),
  );

  const normalizedOrdered = orderedIds
    .map((id) => {
      const saved = mapById.get(id);
      const fallback = defaultsById.get(id) as HeroSectionLink;
      return {
        id,
        label: (saved as HeroSectionLink).label || fallback.label,
        enabled: (saved as HeroSectionLink).enabled,
      };
    })
    .filter((item): item is HeroSectionLink => item !== null);

  for (const fallback of DEFAULT_LINKS) {
    if (!normalizedOrdered.some((item) => item.id === fallback.id)) {
      normalizedOrdered.push(fallback);
    }
  }

  return normalizedOrdered;
}

function normalizeKeywords(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return DEFAULT_HOME_HERO_SETTINGS.keywords;
  }

  const keywords = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 5);

  if (keywords.length === 0) {
    return DEFAULT_HOME_HERO_SETTINGS.keywords;
  }

  return keywords;
}

function normalizeCards(value: unknown): HeroCard[] {
  if (!Array.isArray(value)) {
    return DEFAULT_HOME_HERO_SETTINGS.cards;
  }

  const cards = value
    .filter((item) => item && typeof item === "object")
    .map((item, index) => {
      const candidate = item as Partial<HeroCard>;
      const id = typeof candidate.id === "string" && candidate.id.trim() ? candidate.id : `card-${index + 1}`;
      const title = typeof candidate.title === "string" ? candidate.title.trim() : "";
      const content = typeof candidate.content === "string" ? candidate.content.trim() : "";
      return { id, title, content };
    })
    .filter((card) => card.title || card.content)
    .slice(0, 4);

  if (cards.length === 0) {
    return DEFAULT_HOME_HERO_SETTINGS.cards;
  }

  return cards;
}

function normalizeHomeHeroSettings(value: unknown): HomeHeroSettings {
  if (!value || typeof value !== "object") {
    return DEFAULT_HOME_HERO_SETTINGS;
  }

  const candidate = value as Partial<HomeHeroSettings>;
  const eyebrow = typeof candidate.eyebrow === "string" ? candidate.eyebrow.trim() : "";
  const title = typeof candidate.title === "string" ? candidate.title.trim() : "";
  const subtitle = typeof candidate.subtitle === "string" ? candidate.subtitle.trim() : "";

  return {
    eyebrow: eyebrow || DEFAULT_HOME_HERO_SETTINGS.eyebrow,
    title: title || DEFAULT_HOME_HERO_SETTINGS.title,
    subtitle: subtitle || DEFAULT_HOME_HERO_SETTINGS.subtitle,
    links: normalizeLinks(candidate.links),
    keywords: normalizeKeywords(candidate.keywords),
    cards: normalizeCards(candidate.cards),
  };
}

function normalizeSiteSettings(value: unknown): SiteSettings {
  if (!value || typeof value !== "object") {
    return DEFAULT_SITE_SETTINGS;
  }

  const candidate = value as Partial<SiteSettings>;
  return {
    header: normalizeHeaderSettings(candidate.header),
    homeHero: normalizeHomeHeroSettings(candidate.homeHero),
  };
}

function setCachedSiteSettings(next: SiteSettings) {
  cachedValue = {
    header: normalizeHeaderSettings(next.header),
    homeHero: normalizeHomeHeroSettings(next.homeHero),
  };
  hasLoaded = true;
  notifyListeners();
}

export function getSiteSettings(): SiteSettings {
  return cachedValue;
}

export function getSiteSettingsServer(): SiteSettings {
  return DEFAULT_SITE_SETTINGS;
}

export async function ensureSiteSettingsLoaded(): Promise<SiteSettings> {
  if (typeof window === "undefined") {
    return DEFAULT_SITE_SETTINGS;
  }

  if (hasLoaded) {
    return cachedValue;
  }

  if (pendingLoad) {
    return pendingLoad;
  }

  const apiBase = resolveApiBaseUrl();
  if (!apiBase) {
    hasLoaded = true;
    return cachedValue;
  }

  pendingLoad = (async () => {
    try {
      const response = await fetch(`${apiBase}/api/settings/`);
      if (!response.ok) {
        throw new Error(`Erreur API (${response.status})`);
      }

      const data = (await response.json()) as unknown;
      const normalized = normalizeSiteSettings(data);
      cachedValue = normalized;
      hasLoaded = true;
      notifyListeners();
      return normalized;
    } catch {
      hasLoaded = true;
      return cachedValue;
    } finally {
      pendingLoad = null;
    }
  })();

  return pendingLoad;
}

export async function saveSiteSettings(next: SiteSettings, token: string): Promise<SiteSettings> {
  const apiBase = resolveApiBaseUrl();
  if (!apiBase) {
    throw new Error("Configuration manquante : NEXT_PUBLIC_API_BASE_URL.");
  }

  const payload = {
    header: normalizeHeaderSettings(next.header),
    homeHero: normalizeHomeHeroSettings(next.homeHero),
  };

  const response = await fetch(`${apiBase}/api/settings/admin/`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Erreur API (${response.status})`);
  }

  const data = (await response.json()) as unknown;
  const normalized = normalizeSiteSettings(data);
  cachedValue = normalized;
  hasLoaded = true;
  notifyListeners();
  return normalized;
}

export async function saveHeaderSettings(next: HeaderSettings, token: string): Promise<SiteSettings> {
  const current = await ensureSiteSettingsLoaded();
  return saveSiteSettings(
    {
      ...current,
      header: next,
    },
    token,
  );
}

export async function saveHomeHeroSettings(
  next: HomeHeroSettings,
  token: string,
): Promise<SiteSettings> {
  const current = await ensureSiteSettingsLoaded();
  return saveSiteSettings(
    {
      ...current,
      homeHero: next,
    },
    token,
  );
}

export function subscribeSiteSettings(listener: () => void) {
  listeners.add(listener);
  void ensureSiteSettingsLoaded();
  return () => {
    listeners.delete(listener);
  };
}

export function setHeaderSettings(next: HeaderSettings) {
  setCachedSiteSettings({
    ...cachedValue,
    header: next,
  });
}

export function setHomeHeroSettings(next: HomeHeroSettings) {
  setCachedSiteSettings({
    ...cachedValue,
    homeHero: next,
  });
}

export function resetSiteSettingsStoreForTests() {
  cachedValue = DEFAULT_SITE_SETTINGS;
  hasLoaded = false;
  pendingLoad = null;
  listeners.clear();
}
