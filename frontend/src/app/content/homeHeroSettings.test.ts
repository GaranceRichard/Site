import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_HOME_HERO_SETTINGS,
  getHomeHeroSettings,
  getHomeHeroSettingsServer,
  setHomeHeroSettings,
  subscribeHomeHeroSettings,
} from "./homeHeroSettings";

const HOME_HERO_SETTINGS_KEY = "site_home_hero_settings";

describe("homeHeroSettings", () => {
  it("returns defaults when localStorage is empty", () => {
    window.localStorage.removeItem(HOME_HERO_SETTINGS_KEY);
    expect(getHomeHeroSettings()).toEqual(DEFAULT_HOME_HERO_SETTINGS);
  });

  it("normalizes stored payload", () => {
    window.localStorage.setItem(
      HOME_HERO_SETTINGS_KEY,
      JSON.stringify({
        eyebrow: "  E  ",
        title: "  Titre  ",
        subtitle: "  Sous  ",
        links: [
          { id: "services", label: "  Offres ", enabled: true },
          { id: "bad-id", label: "ignored", enabled: true },
        ],
        keywords: ["  One  ", "", "Two", "Three", "Four", "Five", "Six"],
        cards: [{ id: "x", title: "  A ", content: "  B " }],
      }),
    );

    const value = getHomeHeroSettings();
    expect(value.eyebrow).toBe("E");
    expect(value.title).toBe("Titre");
    expect(value.subtitle).toBe("Sous");
    expect(value.links.find((l) => l.id === "services")?.label).toBe("Offres");
    expect(value.keywords).toEqual(["One", "Two", "Three", "Four", "Five"]);
    expect(value.cards).toEqual([{ id: "x", title: "A", content: "B" }]);
  });

  it("preserves custom links order and appends missing defaults", () => {
    window.localStorage.setItem(
      HOME_HERO_SETTINGS_KEY,
      JSON.stringify({
        links: [
          { id: "method", label: "Approche", enabled: true },
          { id: "services", label: "Publications", enabled: true },
          { id: "method", label: "Approche 2", enabled: false },
        ],
      }),
    );

    const value = getHomeHeroSettings();
    expect(value.links[0].id).toBe("method");
    expect(value.links[1].id).toBe("services");
    expect(value.links.some((link) => link.id === "references")).toBe(true);
  });

  it("falls back to defaults for invalid payload shapes", () => {
    window.localStorage.setItem(
      HOME_HERO_SETTINGS_KEY,
      JSON.stringify({
        eyebrow: 42,
        title: null,
        subtitle: undefined,
        links: "nope",
        keywords: [null, "", "   "],
        cards: [{ id: "", title: "", content: "" }],
      }),
    );

    const value = getHomeHeroSettings();
    expect(value.eyebrow).toBe(DEFAULT_HOME_HERO_SETTINGS.eyebrow);
    expect(value.title).toBe(DEFAULT_HOME_HERO_SETTINGS.title);
    expect(value.subtitle).toBe(DEFAULT_HOME_HERO_SETTINGS.subtitle);
    expect(value.keywords).toEqual(DEFAULT_HOME_HERO_SETTINGS.keywords);
    expect(value.cards).toEqual(DEFAULT_HOME_HERO_SETTINGS.cards);
  });

  it("falls back to defaults when JSON is invalid", () => {
    window.localStorage.setItem(HOME_HERO_SETTINGS_KEY, "{invalid json");
    expect(getHomeHeroSettings()).toEqual(DEFAULT_HOME_HERO_SETTINGS);
  });

  it("writes and notifies listeners", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeHomeHeroSettings(listener);
    setHomeHeroSettings(DEFAULT_HOME_HERO_SETTINGS);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem(HOME_HERO_SETTINGS_KEY)).not.toBeNull();
    unsubscribe();
  });

  it("returns defaults on server snapshot", () => {
    expect(getHomeHeroSettingsServer()).toEqual(DEFAULT_HOME_HERO_SETTINGS);
  });

  it("handles window unavailability", () => {
    const originalWindow = (globalThis as { window?: Window }).window;
    vi.stubGlobal("window", undefined);

    expect(getHomeHeroSettings()).toEqual(DEFAULT_HOME_HERO_SETTINGS);
    expect(() => setHomeHeroSettings(DEFAULT_HOME_HERO_SETTINGS)).not.toThrow();

    vi.stubGlobal("window", originalWindow);
  });

  it("handles localStorage errors gracefully", () => {
    const getSpy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("boom get");
    });
    expect(getHomeHeroSettings()).toEqual(DEFAULT_HOME_HERO_SETTINGS);
    getSpy.mockRestore();

    const listener = vi.fn();
    const unsubscribe = subscribeHomeHeroSettings(listener);
    const setSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("boom set");
    });
    expect(() => setHomeHeroSettings(DEFAULT_HOME_HERO_SETTINGS)).not.toThrow();
    expect(listener).toHaveBeenCalledTimes(1);
    setSpy.mockRestore();
    unsubscribe();
  });
});
