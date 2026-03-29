import { describe, expect, it } from "vitest";

import {
  normalizeAboutSettings,
  normalizeHeaderSettings,
  normalizeHomeHeroSettings,
  normalizeMethodSettings,
  normalizePromiseSettings,
  normalizePublicationsSettings,
  normalizeSiteSettings,
} from "./siteSettingsNormalization";
import {
  DEFAULT_ABOUT_SETTINGS,
  DEFAULT_HEADER_SETTINGS,
  DEFAULT_HOME_HERO_SETTINGS,
  DEFAULT_METHOD_SETTINGS,
  DEFAULT_PROMISE_SETTINGS,
  DEFAULT_PUBLICATIONS_SETTINGS,
  DEFAULT_SITE_SETTINGS,
} from "./siteSettingsSchema";

describe("siteSettingsNormalization", () => {
  it("falls back to default about highlight values when highlight is invalid", () => {
    expect(
      normalizeAboutSettings({
        title: "  A propos  ",
        subtitle: "  Une posture claire  ",
        highlight: "not-an-object",
      }),
    ).toEqual({
      title: "A propos",
      subtitle: "Une posture claire",
      highlight: DEFAULT_ABOUT_SETTINGS.highlight,
    });
  });

  it("falls back to default about highlight items when items are not an array", () => {
    expect(
      normalizeAboutSettings({
        title: "  A propos  ",
        subtitle: "  Une posture claire  ",
        highlight: {
          intro: "  Intro  ",
          items: "not-an-array",
        },
      }),
    ).toEqual({
      title: "A propos",
      subtitle: "Une posture claire",
      highlight: {
        intro: "Intro",
        items: DEFAULT_ABOUT_SETTINGS.highlight.items,
      },
    });
  });

  it("normalizes header and falls back when required values are blank", () => {
    expect(normalizeHeaderSettings(null)).toEqual(DEFAULT_HEADER_SETTINGS);
    expect(
      normalizeHeaderSettings({
        name: "  ",
        title: "  Delivery lead  ",
        bookingUrl: "  ",
      }),
    ).toEqual({
      name: DEFAULT_HEADER_SETTINGS.name,
      title: "Delivery lead",
      bookingUrl: DEFAULT_HEADER_SETTINGS.bookingUrl,
    });

    expect(
      normalizeHeaderSettings({
        name: 12,
        title: "  Ops  ",
        bookingUrl: "https://example.test",
      }),
    ).toEqual({
      name: DEFAULT_HEADER_SETTINGS.name,
      title: "Ops",
      bookingUrl: "https://example.test",
    });
  });

  it("normalizes home hero links, keywords and cards with fallback ordering", () => {
    expect(
      normalizeHomeHeroSettings({
        eyebrow: "  Observer  ",
        title: "  Titre hero  ",
        subtitle: "  Sous-titre hero  ",
        links: [
          null,
          { id: "invalid", label: "ignored", enabled: true },
          { id: "services", label: "  Services  ", enabled: 1 },
          { id: "services", label: "", enabled: false },
          { id: "message", label: "  Contact  ", enabled: true },
        ],
        keywords: ["  Flow  ", "  ", 1, "Delivery", "Ops", "Lean", "Produit"],
        cards: [
          null,
          { id: "", title: "  Card A  ", content: "  Content A  " },
          { title: " ", content: " " },
          { id: "hero-2", title: "", content: "  Content B  " },
        ],
      }),
    ).toEqual({
      eyebrow: "Observer",
      title: "Titre hero",
      subtitle: "Sous-titre hero",
      links: [
        { id: "services", label: "Voir les offres", enabled: false },
        { id: "message", label: "Contact", enabled: true },
        ...DEFAULT_HOME_HERO_SETTINGS.links.filter((link) => !["services", "message"].includes(link.id)),
      ],
      keywords: ["Flow", "Delivery", "Ops", "Lean", "Produit"],
      cards: [
        { id: "card-1", title: "Card A", content: "Content A" },
        { id: "hero-2", title: "", content: "Content B" },
      ],
    });
  });

  it("falls back to default labels when a known link has a non-string label", () => {
    expect(
      normalizeHomeHeroSettings({
        links: [{ id: "services", label: 1, enabled: true }],
      }),
    ).toMatchObject({
      links: expect.arrayContaining([
        {
          id: "services",
          label: "Voir les offres",
          enabled: true,
        },
      ]),
    });
  });

  it("falls back to default hero content when arrays are invalid or empty", () => {
    expect(
      normalizeHomeHeroSettings({
        eyebrow: " ",
        title: " ",
        subtitle: " ",
        links: "bad",
        keywords: [" ", null],
        cards: [{ title: " ", content: " " }],
      }),
    ).toEqual(DEFAULT_HOME_HERO_SETTINGS);
  });

  it("normalizes promise cards and method steps with generated ids", () => {
    expect(
      normalizePromiseSettings({
        title: "  Promise  ",
        subtitle: "  Subtitle  ",
        cards: [
          null,
          { id: "  ", title: "  Card  ", content: "  Content  " },
          { id: "kept", title: "", content: "  Body  " },
        ],
      }),
    ).toEqual({
      title: "Promise",
      subtitle: "Subtitle",
      cards: [
        { id: "promise-card-1", title: "Card", content: "Content" },
        { id: "kept", title: "", content: "Body" },
      ],
    });

    expect(
      normalizeMethodSettings({
        eyebrow: "  Method  ",
        title: "  Title  ",
        subtitle: "  Subtitle  ",
        steps: [
          null,
          { id: " ", step: " ", title: "  Step  ", text: "  Text  " },
          { id: "kept", step: " 09 ", title: "", text: "  Detail  " },
        ],
      }),
    ).toEqual({
      eyebrow: "Method",
      title: "Title",
      subtitle: "Subtitle",
      steps: [
        { id: "method-step-1", step: "01", title: "Step", text: "Text" },
        { id: "kept", step: "09", title: "", text: "Detail" },
      ],
    });
  });

  it("falls back to default promise and method settings when arrays collapse to empty", () => {
    expect(
      normalizePromiseSettings({
        title: " ",
        subtitle: " ",
        cards: [{ title: " ", content: " " }],
      }),
    ).toEqual(DEFAULT_PROMISE_SETTINGS);

    expect(
      normalizeMethodSettings({
        eyebrow: " ",
        title: " ",
        subtitle: " ",
        steps: [{ title: " ", text: " " }],
      }),
    ).toEqual(DEFAULT_METHOD_SETTINGS);

    expect(
      normalizePromiseSettings({
        title: 12,
        subtitle: "  Subtitle  ",
      }),
    ).toEqual({
      title: DEFAULT_PROMISE_SETTINGS.title,
      subtitle: "Subtitle",
      cards: DEFAULT_PROMISE_SETTINGS.cards,
    });
  });

  it("normalizes publications and nested links with defaults", () => {
    expect(
      normalizePublicationsSettings({
        title: "  Publications custom  ",
        subtitle: "  Sub  ",
        highlight: {
          title: "  Focus  ",
          content: "  Evidence  ",
        },
        items: [
          null,
          {
            id: "  ",
            title: "  Item  ",
            content: "  Body  ",
            links: [
              null,
              { id: "  ", title: "  Link  ", url: "  https://example.test  " },
              { id: "bad", title: "", url: "https://example.test/ignored" },
            ],
          },
          { id: "drop", title: " ", content: " " },
        ],
      }),
    ).toEqual({
      title: "Publications custom",
      subtitle: "Sub",
      highlight: {
        title: "Focus",
        content: "Evidence",
      },
      items: [
        {
          id: "publication-1",
          title: "Item",
          content: "Body",
          links: [
            {
              id: "publication-1-link-1",
              title: "Link",
              url: "https://example.test",
            },
          ],
        },
      ],
    });
  });

  it("falls back to default publications and whole-site settings when payload is invalid", () => {
    expect(
      normalizePublicationsSettings({
        title: " ",
        subtitle: " ",
        highlight: "bad",
        items: "bad",
      }),
    ).toEqual({
      ...DEFAULT_PUBLICATIONS_SETTINGS,
      title: DEFAULT_PUBLICATIONS_SETTINGS.title,
      subtitle: DEFAULT_PUBLICATIONS_SETTINGS.subtitle,
      highlight: DEFAULT_PUBLICATIONS_SETTINGS.highlight,
      items: DEFAULT_PUBLICATIONS_SETTINGS.items,
    });

    expect(normalizeSiteSettings(null)).toEqual(DEFAULT_SITE_SETTINGS);
    expect(
      normalizeSiteSettings({
        header: { name: "  Name  " },
        homeHero: { title: "  Hero  " },
        about: { title: "  About  " },
        promise: { title: "  Promise  " },
        method: { title: "  Method  " },
        publications: { title: "  Publications  " },
      }),
    ).toMatchObject({
      header: { name: "Name" },
      homeHero: { title: "Hero" },
      about: { title: "About" },
      promise: { title: "Promise" },
      method: { title: "Method" },
      publications: { title: "Publications" },
    });
  });

  it("covers non-string nested fields across normalizers", () => {
    expect(
      normalizeHomeHeroSettings({
        eyebrow: "Hero",
        title: 42,
        subtitle: null,
        cards: [{ id: 1, title: null, content: 2 }],
      }),
    ).toMatchObject({
      eyebrow: "Hero",
      title: DEFAULT_HOME_HERO_SETTINGS.title,
      subtitle: DEFAULT_HOME_HERO_SETTINGS.subtitle,
      cards: DEFAULT_HOME_HERO_SETTINGS.cards,
    });

    expect(
      normalizePromiseSettings({
        title: "Promise",
        subtitle: 12,
        cards: [{ id: 1, title: null, content: 5 }],
      }),
    ).toMatchObject({
      title: "Promise",
      subtitle: DEFAULT_PROMISE_SETTINGS.subtitle,
      cards: DEFAULT_PROMISE_SETTINGS.cards,
    });

    expect(
      normalizeAboutSettings({
        title: 1,
        subtitle: "About subtitle",
        highlight: {
          intro: 2,
          items: [{ id: 1, text: null }],
        },
      }),
    ).toEqual({
      title: DEFAULT_ABOUT_SETTINGS.title,
      subtitle: "About subtitle",
      highlight: {
        intro: DEFAULT_ABOUT_SETTINGS.highlight.intro,
        items: [],
      },
    });

    expect(
      normalizeMethodSettings({
        eyebrow: "Method",
        title: 3,
        subtitle: "Subtitle",
        steps: [{ id: 1, step: 2, title: null, text: 4 }],
      }),
    ).toEqual({
      eyebrow: "Method",
      title: DEFAULT_METHOD_SETTINGS.title,
      subtitle: "Subtitle",
      steps: DEFAULT_METHOD_SETTINGS.steps,
    });

    expect(
      normalizePublicationsSettings({
        title: 5,
        subtitle: "Sub",
        highlight: { title: 6, content: null },
        items: [{ id: 7, title: null, content: 8, links: [{ id: 9, title: null, url: 10 }] }],
      }),
    ).toEqual({
      title: DEFAULT_PUBLICATIONS_SETTINGS.title,
      subtitle: "Sub",
      highlight: DEFAULT_PUBLICATIONS_SETTINGS.highlight,
      items: [],
    });
  });
});
