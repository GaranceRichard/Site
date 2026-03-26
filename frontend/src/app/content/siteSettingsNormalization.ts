import {
  DEFAULT_ABOUT_SETTINGS,
  DEFAULT_HEADER_SETTINGS,
  DEFAULT_HOME_HERO_SETTINGS,
  DEFAULT_LINKS,
  DEFAULT_METHOD_SETTINGS,
  DEFAULT_PROMISE_SETTINGS,
  DEFAULT_PUBLICATIONS_SETTINGS,
  DEFAULT_SITE_SETTINGS,
  type AboutHighlight,
  type AboutHighlightItem,
  type AboutSettings,
  type HeaderSettings,
  type HeroCard,
  type HeroLinkTarget,
  type HeroSectionLink,
  type HomeHeroSettings,
  type MethodSettings,
  type MethodStep,
  type PromiseCard,
  type PromiseSettings,
  type PublicationHighlight,
  type PublicationItem,
  type PublicationReferenceLink,
  type PublicationsSettings,
  type SiteSettings,
} from "./siteSettingsSchema";

export function normalizeHeaderSettings(value: unknown): HeaderSettings {
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

export function normalizeHomeHeroSettings(value: unknown): HomeHeroSettings {
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

export function normalizePromiseSettings(value: unknown): PromiseSettings {
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

export function normalizeAboutSettings(value: unknown): AboutSettings {
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

export function normalizeMethodSettings(value: unknown): MethodSettings {
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

export function normalizePublicationsSettings(value: unknown): PublicationsSettings {
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

export function normalizeSiteSettings(value: unknown): SiteSettings {
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
