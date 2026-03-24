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

export type PromiseCard = {
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

export type PromiseSettings = {
  title: string;
  subtitle: string;
  cards: PromiseCard[];
};

export type AboutHighlightItem = {
  id: string;
  text: string;
};

export type AboutHighlight = {
  intro: string;
  items: AboutHighlightItem[];
};

export type AboutSettings = {
  title: string;
  subtitle: string;
  highlight: AboutHighlight;
};

export type MethodStep = {
  id: string;
  step: string;
  title: string;
  text: string;
};

export type MethodSettings = {
  eyebrow: string;
  title: string;
  subtitle: string;
  steps: MethodStep[];
};

export type PublicationHighlight = {
  title: string;
  content: string;
};

export type PublicationReferenceLink = {
  id: string;
  title: string;
  url: string;
};

export type PublicationItem = {
  id: string;
  title: string;
  content: string;
  links?: PublicationReferenceLink[];
};

export type PublicationsSettings = {
  title: string;
  subtitle: string;
  highlight: PublicationHighlight;
  items: PublicationItem[];
};

export type SiteSettings = {
  header: HeaderSettings;
  homeHero: HomeHeroSettings;
  about: AboutSettings;
  promise: PromiseSettings;
  method: MethodSettings;
  publications: PublicationsSettings;
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

export const DEFAULT_PROMISE_SETTINGS: PromiseSettings = {
  title: "Un accompagnement serieux, sobre, oriente resultats",
  subtitle:
    "Vous gardez l essentiel : une approche structuree, respectueuse du contexte, qui securise la livraison et renforce l autonomie.",
  cards: [
    {
      id: "promise-card-1",
      title: "Diagnostic rapide",
      content: "Observer le flux, clarifier les irritants, choisir peu d actions a fort effet.",
    },
    {
      id: "promise-card-2",
      title: "Cadre de pilotage",
      content: "Quelques metriques utiles, un rythme de revue, une decision plus fluide.",
    },
    {
      id: "promise-card-3",
      title: "Qualite",
      content: "Stabiliser l execution : limiter le WIP, reduire les reprises, securiser le done.",
    },
    {
      id: "promise-card-4",
      title: "Transfert",
      content: "Rendre l organisation autonome : pratiques, supports, routine d amelioration.",
    },
  ],
};

export const DEFAULT_ABOUT_SETTINGS: AboutSettings = {
  title: "Une posture de service, un cadre exigeant",
  subtitle:
    "Un accompagnement qui respecte les contraintes du terrain, tout en ouvrant des marges de manoeuvre.",
  highlight: {
    intro:
      "Intervenir avec sobriete, clarifier les priorites et aider les equipes a reprendre de l air sans theatre organisationnel.",
    items: [
      { id: "about-item-1", text: "Pragmatisme ancre dans le terrain" },
      { id: "about-item-2", text: "Cadence soutenable" },
      { id: "about-item-3", text: "Decision plus lisible" },
      { id: "about-item-4", text: "Transmission durable" },
    ],
  },
};

export const DEFAULT_METHOD_SETTINGS: MethodSettings = {
  eyebrow: "Approche",
  title: "Un chemin clair, etape par etape",
  subtitle: "Diagnostiquer, decider, mettre en oeuvre, stabiliser - avec rigueur et sobriete.",
  steps: [
    {
      id: "method-step-1",
      step: "01",
      title: "Observer",
      text: "Cartographier le flux, clarifier les irritants, comprendre les contraintes.",
    },
    {
      id: "method-step-2",
      step: "02",
      title: "Choisir",
      text: "Definir 2-3 leviers maximum : priorisation, WIP, qualite, gouvernance.",
    },
    {
      id: "method-step-3",
      step: "03",
      title: "Executer",
      text: "Mettre en place des routines utiles, ajuster, renforcer l autonomie.",
    },
    {
      id: "method-step-4",
      step: "04",
      title: "Ancrer",
      text: "Stabiliser : standards legers, suivi, transfert et montee en competence.",
    },
  ],
};

export const DEFAULT_PUBLICATIONS_SETTINGS: PublicationsSettings = {
  title: "Trois formats, une meme exigence",
  subtitle: "Des interventions calibrees : utiles, lisibles, et soutenables dans la duree.",
  highlight: {
    title: "Format type",
    content: "Diagnostic & cadrage\nAccompagnement (4 a 12 semaines)\nRestitution & plan d'ancrage",
  },
  items: [
    {
      id: "publication-1",
      title: "Coaching Lean-Agile - transformation pragmatique",
      content:
        "Cadrage : objectifs, perimetre, gouvernance legere\nCoaching d'equipes : rituels, flux, qualite, amelioration continue\nAccompagnement des leaders : posture, decision, pilotage",
      links: [
        {
          id: "publication-1-link-1",
          title: "Exemple de cadrage de transformation",
          url: "https://example.com/publications/cadrage-transformation",
        },
      ],
    },
    {
      id: "publication-2",
      title: "Facilitation - ateliers decisifs et alignement",
      content:
        "Ateliers d'alignement (vision, priorites, arbitrages)\nResolution structuree de problemes (A3, 5 Why, etc.)\nConception de parcours d'ateliers (du diagnostic a l'action)",
      links: [
        {
          id: "publication-2-link-1",
          title: "Note sur les ateliers d'alignement",
          url: "https://example.com/publications/ateliers-alignement",
        },
      ],
    },
    {
      id: "publication-3",
      title: "Formation - bases solides, ancrage durable",
      content:
        "Lean / Agile : fondamentaux, pratiques, anti-patterns\nPilotage par la valeur : priorisation, metriques, flow\nTransfert : supports, exercices, plan d'ancrage",
      links: [
        {
          id: "publication-3-link-1",
          title: "Programme de formation Lean-Agile",
          url: "https://example.com/publications/formation-lean-agile",
        },
      ],
    },
  ],
};

const DEFAULT_SITE_SETTINGS: SiteSettings = {
  header: DEFAULT_HEADER_SETTINGS,
  homeHero: DEFAULT_HOME_HERO_SETTINGS,
  about: DEFAULT_ABOUT_SETTINGS,
  promise: DEFAULT_PROMISE_SETTINGS,
  method: DEFAULT_METHOD_SETTINGS,
  publications: DEFAULT_PUBLICATIONS_SETTINGS,
};

const listeners = new Set<() => void>();
let cachedValue: SiteSettings = DEFAULT_SITE_SETTINGS;
let hasLoaded = false;
let hasLoadedFromApi = false;
let pendingLoad: Promise<SiteSettings> | null = null;

function normalizeApiBaseUrl(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.replace(/\/+$/, "");
}

function getApiBaseCandidates(): string[] {
  const resolved = normalizeApiBaseUrl(resolveApiBaseUrl());
  const envBase = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL);

  return Array.from(new Set([resolved, envBase].filter((value): value is string => Boolean(value))));
}

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

function normalizePromiseCards(value: unknown): PromiseCard[] {
  if (!Array.isArray(value)) {
    return DEFAULT_PROMISE_SETTINGS.cards;
  }

  const cards = value
    .filter((item) => item && typeof item === "object")
    .map((item, index) => {
      const candidate = item as Partial<PromiseCard>;
      const id =
        typeof candidate.id === "string" && candidate.id.trim()
          ? candidate.id.trim()
          : `promise-card-${index + 1}`;
      const title = typeof candidate.title === "string" ? candidate.title.trim() : "";
      const content = typeof candidate.content === "string" ? candidate.content.trim() : "";
      return { id, title, content };
    })
    .filter((card) => card.title || card.content)
    .slice(0, 6);

  if (cards.length === 0) {
    return DEFAULT_PROMISE_SETTINGS.cards;
  }

  return cards;
}

function normalizePromiseSettings(value: unknown): PromiseSettings {
  if (!value || typeof value !== "object") {
    return DEFAULT_PROMISE_SETTINGS;
  }

  const candidate = value as Partial<PromiseSettings>;
  const title = typeof candidate.title === "string" ? candidate.title.trim() : "";
  const subtitle = typeof candidate.subtitle === "string" ? candidate.subtitle.trim() : "";

  return {
    title: title || DEFAULT_PROMISE_SETTINGS.title,
    subtitle: subtitle || DEFAULT_PROMISE_SETTINGS.subtitle,
    cards: normalizePromiseCards(candidate.cards),
  };
}

function normalizeAboutHighlightItems(value: unknown): AboutHighlightItem[] {
  if (!Array.isArray(value)) {
    return DEFAULT_ABOUT_SETTINGS.highlight.items;
  }

  return value
    .filter((item) => item && typeof item === "object")
    .map((item, index) => {
      const candidate = item as Partial<AboutHighlightItem>;
      const id =
        typeof candidate.id === "string" && candidate.id.trim()
          ? candidate.id.trim()
          : `about-item-${index + 1}`;
      const text = typeof candidate.text === "string" ? candidate.text.trim() : "";
      return { id, text };
    })
    .filter((item) => item.text)
    .slice(0, 4);
}

function normalizeAboutHighlight(value: unknown): AboutHighlight {
  if (!value || typeof value !== "object") {
    return DEFAULT_ABOUT_SETTINGS.highlight;
  }

  const candidate = value as Partial<AboutHighlight>;
  const intro = typeof candidate.intro === "string" ? candidate.intro.trim() : "";

  return {
    intro: intro || DEFAULT_ABOUT_SETTINGS.highlight.intro,
    items: normalizeAboutHighlightItems(candidate.items),
  };
}

function normalizeAboutSettings(value: unknown): AboutSettings {
  if (!value || typeof value !== "object") {
    return DEFAULT_ABOUT_SETTINGS;
  }

  const candidate = value as Partial<AboutSettings>;
  const title = typeof candidate.title === "string" ? candidate.title.trim() : "";
  const subtitle = typeof candidate.subtitle === "string" ? candidate.subtitle.trim() : "";

  return {
    title: title || DEFAULT_ABOUT_SETTINGS.title,
    subtitle: subtitle || DEFAULT_ABOUT_SETTINGS.subtitle,
    highlight: normalizeAboutHighlight(candidate.highlight),
  };
}

function normalizeMethodSteps(value: unknown): MethodStep[] {
  if (!Array.isArray(value)) {
    return DEFAULT_METHOD_SETTINGS.steps;
  }

  const steps = value
    .filter((item) => item && typeof item === "object")
    .map((item, index) => {
      const candidate = item as Partial<MethodStep>;
      const id =
        typeof candidate.id === "string" && candidate.id.trim()
          ? candidate.id.trim()
          : `method-step-${index + 1}`;
      const step =
        typeof candidate.step === "string" && candidate.step.trim()
          ? candidate.step.trim()
          : String(index + 1).padStart(2, "0");
      const title = typeof candidate.title === "string" ? candidate.title.trim() : "";
      const text = typeof candidate.text === "string" ? candidate.text.trim() : "";
      return { id, step, title, text };
    })
    .filter((item) => item.title || item.text)
    .slice(0, 6);

  if (steps.length === 0) {
    return DEFAULT_METHOD_SETTINGS.steps;
  }

  return steps;
}

function normalizeMethodSettings(value: unknown): MethodSettings {
  if (!value || typeof value !== "object") {
    return DEFAULT_METHOD_SETTINGS;
  }

  const candidate = value as Partial<MethodSettings>;
  const eyebrow = typeof candidate.eyebrow === "string" ? candidate.eyebrow.trim() : "";
  const title = typeof candidate.title === "string" ? candidate.title.trim() : "";
  const subtitle = typeof candidate.subtitle === "string" ? candidate.subtitle.trim() : "";

  return {
    eyebrow: eyebrow || DEFAULT_METHOD_SETTINGS.eyebrow,
    title: title || DEFAULT_METHOD_SETTINGS.title,
    subtitle: subtitle || DEFAULT_METHOD_SETTINGS.subtitle,
    steps: normalizeMethodSteps(candidate.steps),
  };
}

function normalizePublicationHighlight(value: unknown): PublicationHighlight {
  if (!value || typeof value !== "object") {
    return DEFAULT_PUBLICATIONS_SETTINGS.highlight;
  }

  const candidate = value as Partial<PublicationHighlight>;
  const title = typeof candidate.title === "string" ? candidate.title.trim() : "";
  const content = typeof candidate.content === "string" ? candidate.content.trim() : "";

  return {
    title: title || DEFAULT_PUBLICATIONS_SETTINGS.highlight.title,
    content: content || DEFAULT_PUBLICATIONS_SETTINGS.highlight.content,
  };
}

function normalizePublicationItems(value: unknown): PublicationItem[] {
  if (!Array.isArray(value)) {
    return DEFAULT_PUBLICATIONS_SETTINGS.items;
  }

  const items = value
    .filter((item) => item && typeof item === "object")
    .map((item, index) => {
      const candidate = item as Partial<PublicationItem>;
      const id =
        typeof candidate.id === "string" && candidate.id.trim()
          ? candidate.id.trim()
          : `publication-${index + 1}`;
      const title = typeof candidate.title === "string" ? candidate.title.trim() : "";
      const content = typeof candidate.content === "string" ? candidate.content.trim() : "";
      const links = Array.isArray(candidate.links)
        ? candidate.links
            .filter((link) => link && typeof link === "object")
            .map((link, linkIndex) => {
              const linkCandidate = link as Partial<PublicationReferenceLink>;
              const linkId =
                typeof linkCandidate.id === "string" && linkCandidate.id.trim()
                  ? linkCandidate.id.trim()
                  : `${id}-link-${linkIndex + 1}`;
              const linkTitle =
                typeof linkCandidate.title === "string" ? linkCandidate.title.trim() : "";
              const url = typeof linkCandidate.url === "string" ? linkCandidate.url.trim() : "";
              return { id: linkId, title: linkTitle, url };
            })
            .filter((link) => link.title && link.url)
            .slice(0, 3)
        : [];
      return { id, title, content, links };
    })
    .filter((item) => item.title || item.content)
    .slice(0, 4);

  return items;
}

function normalizePublicationsSettings(value: unknown): PublicationsSettings {
  if (!value || typeof value !== "object") {
    return DEFAULT_PUBLICATIONS_SETTINGS;
  }

  const candidate = value as Partial<PublicationsSettings>;
  const title = typeof candidate.title === "string" ? candidate.title.trim() : "";
  const subtitle = typeof candidate.subtitle === "string" ? candidate.subtitle.trim() : "";

  return {
    title: title || DEFAULT_PUBLICATIONS_SETTINGS.title,
    subtitle: subtitle || DEFAULT_PUBLICATIONS_SETTINGS.subtitle,
    highlight: normalizePublicationHighlight(candidate.highlight),
    items: normalizePublicationItems(candidate.items),
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
    about: normalizeAboutSettings(candidate.about),
    promise: normalizePromiseSettings(candidate.promise),
    method: normalizeMethodSettings(candidate.method),
    publications: normalizePublicationsSettings(candidate.publications),
  };
}

function setCachedSiteSettings(next: SiteSettings) {
  cachedValue = {
    header: normalizeHeaderSettings(next.header),
    homeHero: normalizeHomeHeroSettings(next.homeHero),
    about: normalizeAboutSettings(next.about),
    promise: normalizePromiseSettings(next.promise),
    method: normalizeMethodSettings(next.method),
    publications: normalizePublicationsSettings(next.publications),
  };
  hasLoaded = hasLoadedFromApi;
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

  const apiBases = getApiBaseCandidates();
  if (apiBases.length === 0) {
    return cachedValue;
  }

  pendingLoad = (async () => {
    let lastError: Error | null = null;
    try {
      for (const apiBase of apiBases) {
        try {
          const response = await fetch(`${apiBase}/api/settings/`);
          if (!response.ok) {
            throw new Error(`Erreur API (${response.status})`);
          }

          const data = (await response.json()) as unknown;
          const normalized = normalizeSiteSettings(data);
          cachedValue = normalized;
          hasLoaded = true;
          hasLoadedFromApi = true;
          notifyListeners();
          return normalized;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error("Erreur de chargement API");
        }
      }
      throw lastError ?? new Error("Erreur de chargement API");
    } catch {
      return cachedValue;
    } finally {
      pendingLoad = null;
    }
  })();

  return pendingLoad;
}

async function ensureRemoteSiteSettingsForSave(): Promise<SiteSettings> {
  if (getApiBaseCandidates().length === 0) {
    throw new Error("Configuration manquante : NEXT_PUBLIC_API_BASE_URL.");
  }
  const current = await ensureSiteSettingsLoaded();
  if (!hasLoadedFromApi) {
    throw new Error(
      "Impossible de charger les reglages actuels. Rechargez la page puis reessayez.",
    );
  }
  return current;
}

export async function saveSiteSettings(next: SiteSettings, token: string): Promise<SiteSettings> {
  const apiBases = getApiBaseCandidates();
  if (apiBases.length === 0) {
    throw new Error("Configuration manquante : NEXT_PUBLIC_API_BASE_URL.");
  }
  await ensureRemoteSiteSettingsForSave();

  const payload = {
    header: normalizeHeaderSettings(next.header),
    homeHero: normalizeHomeHeroSettings(next.homeHero),
    about: normalizeAboutSettings(next.about),
    promise: normalizePromiseSettings(next.promise),
    method: normalizeMethodSettings(next.method),
    publications: normalizePublicationsSettings(next.publications),
  };

  let lastError: Error | null = null;

  for (const apiBase of apiBases) {
    try {
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
      hasLoadedFromApi = true;
      notifyListeners();
      return normalized;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Erreur API");
    }
  }

  throw lastError ?? new Error("Erreur API");
}

export async function saveHeaderSettings(next: HeaderSettings, token: string): Promise<SiteSettings> {
  const current = await ensureRemoteSiteSettingsForSave();
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
  const current = await ensureRemoteSiteSettingsForSave();
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

export function replaceSiteSettings(next: SiteSettings) {
  hasLoadedFromApi = true;
  hasLoaded = true;
  setCachedSiteSettings(next);
}

export async function savePromiseSettings(next: PromiseSettings, token: string): Promise<SiteSettings> {
  const current = await ensureRemoteSiteSettingsForSave();
  return saveSiteSettings(
    {
      ...current,
      promise: next,
    },
    token,
  );
}

export function setPromiseSettings(next: PromiseSettings) {
  setCachedSiteSettings({
    ...cachedValue,
    promise: next,
  });
}

export async function saveAboutSettings(next: AboutSettings, token: string): Promise<SiteSettings> {
  const current = await ensureRemoteSiteSettingsForSave();
  return saveSiteSettings(
    {
      ...current,
      about: next,
    },
    token,
  );
}

export function setAboutSettings(next: AboutSettings) {
  setCachedSiteSettings({
    ...cachedValue,
    about: next,
  });
}

export async function saveMethodSettings(next: MethodSettings, token: string): Promise<SiteSettings> {
  const current = await ensureRemoteSiteSettingsForSave();
  return saveSiteSettings(
    {
      ...current,
      method: next,
    },
    token,
  );
}

export function setMethodSettings(next: MethodSettings) {
  setCachedSiteSettings({
    ...cachedValue,
    method: next,
  });
}

export async function savePublicationsSettings(
  next: PublicationsSettings,
  token: string,
): Promise<SiteSettings> {
  const current = await ensureRemoteSiteSettingsForSave();
  return saveSiteSettings(
    {
      ...current,
      publications: next,
    },
    token,
  );
}

export function setPublicationsSettings(next: PublicationsSettings) {
  setCachedSiteSettings({
    ...cachedValue,
    publications: next,
  });
}

export function resetSiteSettingsStoreForTests() {
  cachedValue = DEFAULT_SITE_SETTINGS;
  hasLoaded = false;
  hasLoadedFromApi = false;
  pendingLoad = null;
  listeners.clear();
}
