import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_ABOUT_SETTINGS,
  getAboutSettings,
  getAboutSettingsServer,
  setAboutSettings,
  subscribeAboutSettings,
} from "./aboutSettings";
import { resetSiteSettingsStoreForTests } from "./siteSettingsStore";

describe("aboutSettings", () => {
  beforeEach(() => {
    resetSiteSettingsStoreForTests();
    vi.restoreAllMocks();
  });

  it("returns defaults before the API load completes", () => {
    expect(getAboutSettings()).toEqual(DEFAULT_ABOUT_SETTINGS);
  });

  it("writes to the in-memory store and notifies listeners", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeAboutSettings(listener);

    setAboutSettings({
      title: "A propos",
      subtitle: "Sous-titre",
      highlight: {
        intro: "Presentation",
        items: [{ id: "about-1", text: "Encadre" }],
      },
    });

    expect(getAboutSettings()).toEqual({
      title: "A propos",
      subtitle: "Sous-titre",
      highlight: {
        intro: "Presentation",
        items: [{ id: "about-1", text: "Encadre" }],
      },
    });
    expect(listener).toHaveBeenCalled();
    unsubscribe();
  });

  it("returns defaults on server snapshot", () => {
    expect(getAboutSettingsServer()).toEqual(DEFAULT_ABOUT_SETTINGS);
  });

  it("returns the unsubscribe function from the shared store subscription", () => {
    const listener = vi.fn();

    const unsubscribe = subscribeAboutSettings(listener);
    unsubscribe();

    setAboutSettings({
      title: "After unsubscribe",
      subtitle: "No notify",
      highlight: {
        intro: "Silent",
        items: [{ id: "about-2", text: "Listener removed" }],
      },
    });

    expect(listener).not.toHaveBeenCalled();
  });
});
