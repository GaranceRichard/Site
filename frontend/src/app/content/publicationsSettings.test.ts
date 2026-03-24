import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_PUBLICATIONS_SETTINGS,
  getPublicationsSettings,
  getPublicationsSettingsServer,
  subscribePublicationsSettings,
  setPublicationsSettings,
} from "./publicationsSettings";
import { resetSiteSettingsStoreForTests } from "./siteSettingsStore";

describe("publicationsSettings", () => {
  beforeEach(() => {
    resetSiteSettingsStoreForTests();
  });

  it("returns defaults on the server snapshot", () => {
    expect(getPublicationsSettingsServer()).toEqual(DEFAULT_PUBLICATIONS_SETTINGS);
  });

  it("reads and updates publications through the shared store", () => {
    const listener = vi.fn();
    const unsubscribe = subscribePublicationsSettings(listener);

    setPublicationsSettings({
      ...DEFAULT_PUBLICATIONS_SETTINGS,
      title: "Publications revisees",
    });

    expect(getPublicationsSettings().title).toBe("Publications revisees");
    expect(listener).toHaveBeenCalled();

    unsubscribe();
  });
});
