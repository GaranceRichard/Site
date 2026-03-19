import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/backoffice", () => ({
  resolveApiBaseUrl: vi.fn(() => "/api-proxy"),
}));

import { resolveApiBaseUrl } from "../lib/backoffice";
import {
  DEFAULT_HEADER_SETTINGS,
  DEFAULT_HOME_HERO_SETTINGS,
  ensureSiteSettingsLoaded,
  getSiteSettings,
  getSiteSettingsServer,
  resetSiteSettingsStoreForTests,
  saveHeaderSettings,
  saveHomeHeroSettings,
  saveSiteSettings,
  setHeaderSettings,
  setHomeHeroSettings,
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

  it("keeps defaults when the API request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("boom")));

    await ensureSiteSettingsLoaded();

    expect(getSiteSettings().header).toEqual(DEFAULT_HEADER_SETTINGS);
    expect(getSiteSettings().homeHero).toEqual(DEFAULT_HOME_HERO_SETTINGS);
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
        },
        "token",
      ),
    ).rejects.toThrow("Erreur API (503)");
  });

  it("updates header and home hero through helper setters and save wrappers", async () => {
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
    expect(fetchSpy).toHaveBeenCalledTimes(2);
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
    } satisfies SiteSettings);
  });
});
