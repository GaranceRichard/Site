import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_HOME_HERO_SETTINGS,
  getHomeHeroSettings,
  getHomeHeroSettingsServer,
  setHomeHeroSettings,
  subscribeHomeHeroSettings,
} from "./homeHeroSettings";
import { resetSiteSettingsStoreForTests } from "./siteSettingsStore";

describe("homeHeroSettings", () => {
  beforeEach(() => {
    resetSiteSettingsStoreForTests();
    vi.restoreAllMocks();
  });

  it("returns defaults before the API load completes", () => {
    expect(getHomeHeroSettings()).toEqual(DEFAULT_HOME_HERO_SETTINGS);
  });

  it("writes to the in-memory store and notifies listeners", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeHomeHeroSettings(listener);

    setHomeHeroSettings({
      ...DEFAULT_HOME_HERO_SETTINGS,
      eyebrow: "Nouveau surtitre",
    });

    expect(getHomeHeroSettings().eyebrow).toBe("Nouveau surtitre");
    expect(listener).toHaveBeenCalled();
    unsubscribe();
  });

  it("returns defaults on server snapshot", () => {
    expect(getHomeHeroSettingsServer()).toEqual(DEFAULT_HOME_HERO_SETTINGS);
  });
});
