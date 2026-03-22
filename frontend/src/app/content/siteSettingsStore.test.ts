import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/backoffice", () => ({
  resolveApiBaseUrl: vi.fn(() => "/api-proxy"),
}));

import { resolveApiBaseUrl } from "../lib/backoffice";
import {
  DEFAULT_HEADER_SETTINGS,
  DEFAULT_HOME_HERO_SETTINGS,
  DEFAULT_METHOD_SETTINGS,
  DEFAULT_PROMISE_SETTINGS,
  ensureSiteSettingsLoaded,
  getSiteSettings,
  getSiteSettingsServer,
  resetSiteSettingsStoreForTests,
  saveHeaderSettings,
  saveHomeHeroSettings,
  saveMethodSettings,
  savePromiseSettings,
  saveSiteSettings,
  setHeaderSettings,
  setHomeHeroSettings,
  setMethodSettings,
  setPromiseSettings,
  subscribeSiteSettings,
  type SiteSettings,
} from "./siteSettingsStore";

const mockedResolveApiBaseUrl = vi.mocked(resolveApiBaseUrl);

describe("siteSettingsStore", () => {
  beforeEach(() => {
    resetSiteSettingsStoreForTests();
    vi.restoreAllMocks();
    mockedResolveApiBaseUrl.mockReturnValue("/api-proxy");
  });

  it("returns defaults on the server without fetching", async () => {
    const originalWindow = globalThis.window;
    Reflect.deleteProperty(globalThis, "window");
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    try {
      await expect(ensureSiteSettingsLoaded()).resolves.toEqual(getSiteSettingsServer());
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(globalThis, "window", {
        value: originalWindow,
        configurable: true,
        writable: true,
      });
    }
  });

  it("loads and normalizes site settings from the API", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          header: {
            name: "  Jane Doe ",
            title: " Agile Coach ",
            bookingUrl: " https://example.com/book ",
          },
          homeHero: {
            eyebrow: "  Eyebrow ",
            title: "  Titre ",
            subtitle: " Sous-titre ",
            links: [{ id: "services", label: " Offres ", enabled: true }],
            keywords: ["  Clarte ", "", "Focus"],
            cards: [{ id: "", title: " Carte ", content: " Contenu " }],
          },
        }),
      }),
    );

    const result = await ensureSiteSettingsLoaded();

    expect(result.header).toEqual({
      name: "Jane Doe",
      title: "Agile Coach",
      bookingUrl: "https://example.com/book",
    });
    expect(result.homeHero.eyebrow).toBe("Eyebrow");
    expect(result.homeHero.links[0].label).toBe("Offres");
    expect(result.homeHero.keywords).toEqual(["Clarte", "Focus"]);
    expect(result.homeHero.cards[0]).toEqual({
      id: "card-1",
      title: "Carte",
      content: "Contenu",
    });
    expect(result.method).toEqual(DEFAULT_METHOD_SETTINGS);
  });

  it("falls back to defaults when the payload is partial or invalid", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          header: {
            name: " ",
            title: 42,
            bookingUrl: "",
          },
          homeHero: {
            eyebrow: "",
            title: "  Hero title  ",
            subtitle: null,
            links: [
              null,
              { id: "invalid", label: "Ignored", enabled: true },
              { id: "services", label: " ", enabled: 0 },
              { id: "services", label: " Override ", enabled: true },
            ],
            keywords: [" ", 7, "Flow", "Clarity", "Focus", "Extra", "Overflow"],
            cards: [
              null,
              { id: "", title: " ", content: " " },
              { title: " Card 1 ", content: " Body 1 " },
              { id: "custom-2", title: "", content: " Body 2 " },
              { id: "custom-3", title: " Card 3 ", content: "" },
              { id: "custom-4", title: " Card 4 ", content: " Body 4 " },
              { id: "custom-5", title: " Card 5 ", content: " Body 5 " },
            ],
          },
        }),
      }),
    );

    const result = await ensureSiteSettingsLoaded();

    expect(result.header).toEqual(DEFAULT_HEADER_SETTINGS);
    expect(result.homeHero.eyebrow).toBe(DEFAULT_HOME_HERO_SETTINGS.eyebrow);
    expect(result.homeHero.title).toBe("Hero title");
    expect(result.homeHero.subtitle).toBe(DEFAULT_HOME_HERO_SETTINGS.subtitle);
    expect(result.homeHero.links[0]).toEqual({
      id: "services",
      label: "Override",
      enabled: true,
    });
    expect(result.homeHero.links).toHaveLength(DEFAULT_HOME_HERO_SETTINGS.links.length);
    expect(result.homeHero.links[1]).toEqual(DEFAULT_HOME_HERO_SETTINGS.links[1]);
    expect(result.homeHero.keywords).toEqual(["Flow", "Clarity", "Focus", "Extra", "Overflow"]);
    expect(result.homeHero.cards).toEqual([
      { id: "card-2", title: "Card 1", content: "Body 1" },
      { id: "custom-2", title: "", content: "Body 2" },
      { id: "custom-3", title: "Card 3", content: "" },
      { id: "custom-4", title: "Card 4", content: "Body 4" },
    ]);
  });

  it("falls back when header or home hero objects are missing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          header: null,
          homeHero: null,
        }),
      }),
    );

    const result = await ensureSiteSettingsLoaded();

    expect(result.header).toEqual(DEFAULT_HEADER_SETTINGS);
    expect(result.homeHero).toEqual(DEFAULT_HOME_HERO_SETTINGS);
    expect(result.method).toEqual(DEFAULT_METHOD_SETTINGS);
  });

  it("falls back when keywords and cards are not arrays", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          header: DEFAULT_HEADER_SETTINGS,
          homeHero: {
            ...DEFAULT_HOME_HERO_SETTINGS,
            keywords: "not-an-array",
            cards: "not-an-array",
          },
        }),
      }),
    );

    const result = await ensureSiteSettingsLoaded();

    expect(result.homeHero.keywords).toEqual(DEFAULT_HOME_HERO_SETTINGS.keywords);
    expect(result.homeHero.cards).toEqual(DEFAULT_HOME_HERO_SETTINGS.cards);
  });

  it("falls back when promise cards are not an array", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          header: DEFAULT_HEADER_SETTINGS,
          homeHero: DEFAULT_HOME_HERO_SETTINGS,
          promise: {
            ...DEFAULT_PROMISE_SETTINGS,
            cards: "not-an-array",
          },
        }),
      }),
    );

    const result = await ensureSiteSettingsLoaded();

    expect(result.promise.cards).toEqual(DEFAULT_PROMISE_SETTINGS.cards);
  });

  it("falls back when method steps are not an array", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          header: DEFAULT_HEADER_SETTINGS,
          homeHero: DEFAULT_HOME_HERO_SETTINGS,
          promise: DEFAULT_PROMISE_SETTINGS,
          method: {
            ...DEFAULT_METHOD_SETTINGS,
            steps: "not-an-array",
          },
        }),
      }),
    );

    const result = await ensureSiteSettingsLoaded();

    expect(result.method.steps).toEqual(DEFAULT_METHOD_SETTINGS.steps);
  });

  it("normalizes method title, subtitle and steps when the payload is partial", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          header: DEFAULT_HEADER_SETTINGS,
          homeHero: DEFAULT_HOME_HERO_SETTINGS,
          promise: DEFAULT_PROMISE_SETTINGS,
          method: {
            eyebrow: " ",
            title: " ",
            subtitle: null,
            steps: [
              null,
              { id: "  custom-step  ", step: "  A1 ", title: " Observer ", text: " Comprendre " },
              { id: "", step: "", title: "", text: " Texte seul " },
              { id: "", step: "", title: " Titre seul ", text: "" },
            ],
          },
        }),
      }),
    );

    const result = await ensureSiteSettingsLoaded();

    expect(result.method.eyebrow).toBe(DEFAULT_METHOD_SETTINGS.eyebrow);
    expect(result.method.title).toBe(DEFAULT_METHOD_SETTINGS.title);
    expect(result.method.subtitle).toBe(DEFAULT_METHOD_SETTINGS.subtitle);
    expect(result.method.steps).toEqual([
      { id: "custom-step", step: "A1", title: "Observer", text: "Comprendre" },
      { id: "method-step-2", step: "02", title: "", text: "Texte seul" },
      { id: "method-step-3", step: "03", title: "Titre seul", text: "" },
    ]);
  });

  it("normalizes promise title, subtitle and cards when the payload is partial", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          header: DEFAULT_HEADER_SETTINGS,
          homeHero: DEFAULT_HOME_HERO_SETTINGS,
          promise: {
            title: " ",
            subtitle: null,
            cards: [
              null,
              { id: "  promise-custom  ", title: " Promise custom ", content: " Body " },
              { id: "", title: "", content: " Content only " },
              { id: "", title: " Title only ", content: "" },
              { id: "", title: " Card 4 ", content: " Body 4 " },
              { id: "", title: " Card 5 ", content: " Body 5 " },
              { id: "", title: " Card 6 ", content: " Body 6 " },
              { id: "", title: " Card 7 ", content: " Body 7 " },
            ],
          },
        }),
      }),
    );

    const result = await ensureSiteSettingsLoaded();

    expect(result.promise.title).toBe(DEFAULT_PROMISE_SETTINGS.title);
    expect(result.promise.subtitle).toBe(DEFAULT_PROMISE_SETTINGS.subtitle);
    expect(result.promise.cards).toEqual([
      { id: "promise-custom", title: "Promise custom", content: "Body" },
      { id: "promise-card-2", title: "", content: "Content only" },
      { id: "promise-card-3", title: "Title only", content: "" },
      { id: "promise-card-4", title: "Card 4", content: "Body 4" },
      { id: "promise-card-5", title: "Card 5", content: "Body 5" },
      { id: "promise-card-6", title: "Card 6", content: "Body 6" },
    ]);
  });

  it("falls back when cleaned keywords and cards become empty", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          header: DEFAULT_HEADER_SETTINGS,
          homeHero: {
            ...DEFAULT_HOME_HERO_SETTINGS,
            keywords: [" ", "", "   "],
            cards: [{ id: "", title: " ", content: " " }],
          },
        }),
      }),
    );

    const result = await ensureSiteSettingsLoaded();

    expect(result.homeHero.keywords).toEqual(DEFAULT_HOME_HERO_SETTINGS.keywords);
    expect(result.homeHero.cards).toEqual(DEFAULT_HOME_HERO_SETTINGS.cards);
  });

  it("falls back when cleaned promise cards become empty", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          header: DEFAULT_HEADER_SETTINGS,
          homeHero: DEFAULT_HOME_HERO_SETTINGS,
          promise: {
            ...DEFAULT_PROMISE_SETTINGS,
            cards: [{ id: "", title: " ", content: " " }],
          },
        }),
      }),
    );

    const result = await ensureSiteSettingsLoaded();

    expect(result.promise.cards).toEqual(DEFAULT_PROMISE_SETTINGS.cards);
  });

  it("falls back when cleaned method steps become empty", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          header: DEFAULT_HEADER_SETTINGS,
          homeHero: DEFAULT_HOME_HERO_SETTINGS,
          promise: DEFAULT_PROMISE_SETTINGS,
          method: {
            ...DEFAULT_METHOD_SETTINGS,
            steps: [
              null,
              { id: "", step: "", title: " ", text: " " },
            ],
          },
        }),
      }),
    );

    const result = await ensureSiteSettingsLoaded();

    expect(result.method.steps).toEqual(DEFAULT_METHOD_SETTINGS.steps);
  });

  it("keeps defaults when the API request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("boom")));

    await ensureSiteSettingsLoaded();

    expect(getSiteSettings().header).toEqual(DEFAULT_HEADER_SETTINGS);
    expect(getSiteSettings().homeHero).toEqual(DEFAULT_HOME_HERO_SETTINGS);
    expect(getSiteSettings().method).toEqual(DEFAULT_METHOD_SETTINGS);
  });

  it("keeps defaults when the API responds with a non-ok status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
      }),
    );

    await ensureSiteSettingsLoaded();

    expect(getSiteSettings().header).toEqual(DEFAULT_HEADER_SETTINGS);
    expect(getSiteSettings().homeHero).toEqual(DEFAULT_HOME_HERO_SETTINGS);
  });

  it("returns the cached value after the first successful load", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
        json: async () => ({
          header: { ...DEFAULT_HEADER_SETTINGS, name: "Loaded once" },
          homeHero: DEFAULT_HOME_HERO_SETTINGS,
          promise: DEFAULT_PROMISE_SETTINGS,
          method: DEFAULT_METHOD_SETTINGS,
        }),
    });
    vi.stubGlobal("fetch", fetchSpy);

    const first = await ensureSiteSettingsLoaded();
    const second = await ensureSiteSettingsLoaded();

    expect(first.header.name).toBe("Loaded once");
    expect(second).toBe(first);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("reuses the same pending load for concurrent callers", async () => {
    let resolveFetch: ((value: unknown) => void) | undefined;
    const fetchSpy = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
    );
    vi.stubGlobal("fetch", fetchSpy);

    const first = ensureSiteSettingsLoaded();
    const second = ensureSiteSettingsLoaded();

    expect(fetchSpy).toHaveBeenCalledTimes(1);

    resolveFetch?.({
      ok: true,
        json: async () => ({
          header: { ...DEFAULT_HEADER_SETTINGS, name: "Concurrent" },
          homeHero: DEFAULT_HOME_HERO_SETTINGS,
          promise: DEFAULT_PROMISE_SETTINGS,
          method: DEFAULT_METHOD_SETTINGS,
        }),
    });

    await expect(first).resolves.toMatchObject({
      header: { name: "Concurrent" },
    });
    await expect(second).resolves.toMatchObject({
      header: { name: "Concurrent" },
    });
  });

  it("short-circuits loading when the API base URL is unavailable", async () => {
    mockedResolveApiBaseUrl.mockReturnValue(undefined);
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    await expect(ensureSiteSettingsLoaded()).resolves.toEqual(getSiteSettings());
    await expect(ensureSiteSettingsLoaded()).resolves.toEqual(getSiteSettings());
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("saves settings, normalizes the payload, and notifies subscribers", async () => {
    const listener = vi.fn();
    const fetchSpy = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          header: DEFAULT_HEADER_SETTINGS,
          homeHero: DEFAULT_HOME_HERO_SETTINGS,
          promise: DEFAULT_PROMISE_SETTINGS,
          method: DEFAULT_METHOD_SETTINGS,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          header: {
            name: " Saved ",
            title: "",
            bookingUrl: " https://example.com/saved ",
          },
          homeHero: {
            eyebrow: "  Next eyebrow ",
            title: "",
            subtitle: "  Next subtitle ",
            links: [{ id: "references", label: "", enabled: true }],
            keywords: [" ", "Delivery"],
            cards: [{ id: "", title: "  New card ", content: "  New content " }],
          },
          promise: {
            title: " Promise title ",
            subtitle: " Promise subtitle ",
            cards: [{ id: "", title: " Promise card ", content: " Promise content " }],
          },
          method: {
            eyebrow: " Approche ",
            title: " Methode ",
            subtitle: " Stabiliser le flux ",
            steps: [{ id: "", step: "", title: " Etape ", text: " Texte " }],
          },
        }),
      });
    vi.stubGlobal("fetch", fetchSpy);
    const unsubscribe = subscribeSiteSettings(listener);

    const result = await saveSiteSettings(
      {
        header: {
          name: " Saved ",
          title: "",
          bookingUrl: " https://example.com/saved ",
        },
        homeHero: {
          eyebrow: "  Next eyebrow ",
          title: "",
          subtitle: "  Next subtitle ",
          links: [{ id: "references", label: "", enabled: true }],
          keywords: [" ", "Delivery"],
          cards: [{ id: "", title: "  New card ", content: "  New content " }],
        },
        promise: {
          title: " Promise title ",
          subtitle: " Promise subtitle ",
          cards: [{ id: "", title: " Promise card ", content: " Promise content " }],
        },
        method: {
          eyebrow: " Approche ",
          title: " Methode ",
          subtitle: " Stabiliser le flux ",
          steps: [{ id: "", step: "", title: " Etape ", text: " Texte " }],
        },
      },
      "token-123",
    );

    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      "/api-proxy/api/settings/admin/",
      expect.objectContaining({
        method: "PUT",
        headers: {
          Authorization: "Bearer token-123",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          header: {
            name: "Saved",
            title: DEFAULT_HEADER_SETTINGS.title,
            bookingUrl: "https://example.com/saved",
          },
          homeHero: {
            eyebrow: "Next eyebrow",
            title: DEFAULT_HOME_HERO_SETTINGS.title,
            subtitle: "Next subtitle",
            links: [
              { id: "references", label: "Exemples d'impact", enabled: true },
              ...DEFAULT_HOME_HERO_SETTINGS.links.filter((link) => link.id !== "references"),
            ],
            keywords: ["Delivery"],
            cards: [{ id: "card-1", title: "New card", content: "New content" }],
          },
          promise: {
            title: "Promise title",
            subtitle: "Promise subtitle",
            cards: [{ id: "promise-card-1", title: "Promise card", content: "Promise content" }],
          },
          method: {
            eyebrow: "Approche",
            title: "Methode",
            subtitle: "Stabiliser le flux",
            steps: [{ id: "method-step-1", step: "01", title: "Etape", text: "Texte" }],
          },
        }),
      }),
    );
    expect(result.header).toEqual({
      name: "Saved",
      title: DEFAULT_HEADER_SETTINGS.title,
      bookingUrl: "https://example.com/saved",
    });
    expect(result.homeHero.links[0]).toEqual({
      id: "references",
      label: "Exemples d'impact",
      enabled: true,
    });
    expect(result.promise.title).toBe("Promise title");
    expect(result.method.title).toBe("Methode");
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
  });

  it("throws helpful save errors for missing config and failed responses", async () => {
    mockedResolveApiBaseUrl.mockReturnValue(undefined);

    await expect(
      saveSiteSettings(
        {
          header: DEFAULT_HEADER_SETTINGS,
          homeHero: DEFAULT_HOME_HERO_SETTINGS,
          promise: DEFAULT_PROMISE_SETTINGS,
          method: DEFAULT_METHOD_SETTINGS,
        },
        "token",
      ),
    ).rejects.toThrow("Configuration manquante : NEXT_PUBLIC_API_BASE_URL.");

    mockedResolveApiBaseUrl.mockReturnValue("/api-proxy");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => "Backend exploded",
      }),
    );

    await expect(
      saveSiteSettings(
        {
          header: DEFAULT_HEADER_SETTINGS,
          homeHero: DEFAULT_HOME_HERO_SETTINGS,
          promise: DEFAULT_PROMISE_SETTINGS,
          method: DEFAULT_METHOD_SETTINGS,
        },
        "token",
      ),
    ).rejects.toThrow("Backend exploded");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 503,
        text: async () => "",
      }),
    );

    await expect(
      saveSiteSettings(
        {
          header: DEFAULT_HEADER_SETTINGS,
          homeHero: DEFAULT_HOME_HERO_SETTINGS,
          promise: DEFAULT_PROMISE_SETTINGS,
        },
        "token",
      ),
    ).rejects.toThrow("Erreur API (503)");
  });

  it("updates header, home hero, promise and method through helper setters and save wrappers", async () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          header: {
            name: "Header wrapper",
            title: "Coach",
            bookingUrl: "https://example.com/header",
          },
          homeHero: DEFAULT_HOME_HERO_SETTINGS,
          promise: DEFAULT_PROMISE_SETTINGS,
          method: DEFAULT_METHOD_SETTINGS,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          header: {
            name: "Header wrapper",
            title: "Coach",
            bookingUrl: "https://example.com/header",
          },
          homeHero: {
            ...DEFAULT_HOME_HERO_SETTINGS,
            eyebrow: "Hero wrapper",
          },
          promise: DEFAULT_PROMISE_SETTINGS,
          method: DEFAULT_METHOD_SETTINGS,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          header: {
            name: "Header wrapper",
            title: "Coach",
            bookingUrl: "https://example.com/header",
          },
          homeHero: {
            ...DEFAULT_HOME_HERO_SETTINGS,
            eyebrow: "Hero wrapper",
          },
          promise: {
            ...DEFAULT_PROMISE_SETTINGS,
            title: "Promise wrapper",
          },
          method: {
            ...DEFAULT_METHOD_SETTINGS,
            title: "Method wrapper",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          header: {
            name: "Header wrapper",
            title: "Coach",
            bookingUrl: "https://example.com/header",
          },
          homeHero: {
            ...DEFAULT_HOME_HERO_SETTINGS,
            eyebrow: "Hero wrapper",
          },
          promise: {
            ...DEFAULT_PROMISE_SETTINGS,
            title: "Promise wrapper",
          },
          method: {
            ...DEFAULT_METHOD_SETTINGS,
            title: "Method wrapper",
          },
        }),
      });
    vi.stubGlobal("fetch", fetchSpy);

    setHeaderSettings({
      name: "Local header",
      title: "Local title",
      bookingUrl: "https://example.com/local",
    });
    expect(getSiteSettings().header.name).toBe("Local header");

    setHomeHeroSettings({
      ...DEFAULT_HOME_HERO_SETTINGS,
      eyebrow: "Local hero",
    });
    expect(getSiteSettings().homeHero.eyebrow).toBe("Local hero");

    setPromiseSettings({
      ...DEFAULT_PROMISE_SETTINGS,
      title: "Local promise",
    });
    expect(getSiteSettings().promise.title).toBe("Local promise");

    setMethodSettings({
      ...DEFAULT_METHOD_SETTINGS,
      title: "Local method",
    });
    expect(getSiteSettings().method.title).toBe("Local method");

    const savedHeader = await saveHeaderSettings(
      {
        name: "Header wrapper",
        title: "Coach",
        bookingUrl: "https://example.com/header",
      },
      "token",
    );
    expect(savedHeader.header.name).toBe("Header wrapper");

    const savedHero = await saveHomeHeroSettings(
      {
        ...DEFAULT_HOME_HERO_SETTINGS,
        eyebrow: "Hero wrapper",
      },
      "token",
    );
    expect(savedHero.homeHero.eyebrow).toBe("Hero wrapper");

    const savedPromise = await savePromiseSettings(
      {
        ...DEFAULT_PROMISE_SETTINGS,
        title: "Promise wrapper",
      },
      "token",
    );
    expect(savedPromise.promise.title).toBe("Promise wrapper");

    const savedMethod = await saveMethodSettings(
      {
        ...DEFAULT_METHOD_SETTINGS,
        title: "Method wrapper",
      },
      "token",
    );
    expect(savedMethod.method.title).toBe("Method wrapper");
    expect(fetchSpy).toHaveBeenCalledTimes(4);
  });

  it("normalizes local setter values and stops notifying after unsubscribe", async () => {
    const listener = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          header: DEFAULT_HEADER_SETTINGS,
          homeHero: DEFAULT_HOME_HERO_SETTINGS,
          promise: DEFAULT_PROMISE_SETTINGS,
          method: DEFAULT_METHOD_SETTINGS,
        }),
      }),
    );

    const unsubscribe = subscribeSiteSettings(listener);

    setHeaderSettings({
      name: "  Local header  ",
      title: " ",
      bookingUrl: "  https://example.com/local  ",
    });
    expect(getSiteSettings().header).toEqual({
      name: "Local header",
      title: DEFAULT_HEADER_SETTINGS.title,
      bookingUrl: "https://example.com/local",
    });

    setHomeHeroSettings({
      eyebrow: " ",
      title: "  Hero title  ",
      subtitle: "",
      links: [
        { id: "message", label: "  Me contacter  ", enabled: true },
        { id: "message", label: "", enabled: false },
      ],
      keywords: [" ", "Flow"],
      cards: [{ id: "", title: " ", content: " Body " }],
    });
    expect(getSiteSettings().homeHero).toEqual({
      eyebrow: DEFAULT_HOME_HERO_SETTINGS.eyebrow,
      title: "Hero title",
      subtitle: DEFAULT_HOME_HERO_SETTINGS.subtitle,
      links: [
        { id: "message", label: "Message", enabled: false },
        ...DEFAULT_HOME_HERO_SETTINGS.links.filter((link) => link.id !== "message"),
      ],
      keywords: ["Flow"],
      cards: [{ id: "card-1", title: "", content: "Body" }],
    });

    setPromiseSettings({
      title: " ",
      subtitle: "  Promise subtitle  ",
      cards: [{ id: "", title: " ", content: " Promise body " }],
    });
    expect(getSiteSettings().promise).toEqual({
      title: DEFAULT_PROMISE_SETTINGS.title,
      subtitle: "Promise subtitle",
      cards: [{ id: "promise-card-1", title: "", content: "Promise body" }],
    });

    setMethodSettings({
      eyebrow: " ",
      title: "  Methode  ",
      subtitle: " ",
      steps: [{ id: "", step: "", title: "  Observer  ", text: " Comprendre " }],
    });
    expect(getSiteSettings().method).toEqual({
      eyebrow: DEFAULT_METHOD_SETTINGS.eyebrow,
      title: "Methode",
      subtitle: DEFAULT_METHOD_SETTINGS.subtitle,
      steps: [{ id: "method-step-1", step: "01", title: "Observer", text: "Comprendre" }],
    });

    unsubscribe();
    const callsBefore = listener.mock.calls.length;

    setHeaderSettings({
      name: "No listener anymore",
      title: "Coach",
      bookingUrl: "https://example.com/next",
    });

    expect(listener).toHaveBeenCalledTimes(callsBefore);
  });

  it("returns defaults when normalizing a completely invalid site settings object", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => "invalid-payload",
      }),
    );

    await expect(ensureSiteSettingsLoaded()).resolves.toEqual({
      header: DEFAULT_HEADER_SETTINGS,
      homeHero: DEFAULT_HOME_HERO_SETTINGS,
      promise: DEFAULT_PROMISE_SETTINGS,
      method: DEFAULT_METHOD_SETTINGS,
    } satisfies SiteSettings);
  });
});
