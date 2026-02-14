"use client";

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

const HOME_HERO_SETTINGS_KEY = "site_home_hero_settings";
const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cachedValue: HomeHeroSettings = DEFAULT_HOME_HERO_SETTINGS;

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
      const fallback = defaultsById.get(id);
      if (!saved || !fallback) {
        return null;
      }
      return {
        id,
        label: saved.label || fallback.label,
        enabled: saved.enabled,
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

export function getHomeHeroSettings(): HomeHeroSettings {
  if (typeof window === "undefined") {
    return DEFAULT_HOME_HERO_SETTINGS;
  }

  try {
    const raw = window.localStorage.getItem(HOME_HERO_SETTINGS_KEY);
    if (raw === cachedRaw) {
      return cachedValue;
    }

    if (!raw) {
      cachedRaw = raw;
      cachedValue = DEFAULT_HOME_HERO_SETTINGS;
      return cachedValue;
    }

    cachedRaw = raw;
    cachedValue = normalizeHomeHeroSettings(JSON.parse(raw));
    return cachedValue;
  } catch {
    return DEFAULT_HOME_HERO_SETTINGS;
  }
}

export function getHomeHeroSettingsServer(): HomeHeroSettings {
  return DEFAULT_HOME_HERO_SETTINGS;
}

export function setHomeHeroSettings(next: HomeHeroSettings) {
  if (typeof window === "undefined") {
    return;
  }

  const normalized = normalizeHomeHeroSettings(next);
  const serialized = JSON.stringify(normalized);

  cachedValue = normalized;
  cachedRaw = serialized;
  try {
    window.localStorage.setItem(HOME_HERO_SETTINGS_KEY, serialized);
  } catch {
    // ignore storage errors
  }

  for (const listener of listeners) {
    listener();
  }
}

export function subscribeHomeHeroSettings(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
