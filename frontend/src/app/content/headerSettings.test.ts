import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_HEADER_SETTINGS,
  getHeaderSettings,
  getHeaderSettingsServer,
  setHeaderSettings,
  subscribeHeaderSettings,
} from "./headerSettings";
import { resetSiteSettingsStoreForTests } from "./siteSettingsStore";

describe("headerSettings", () => {
  beforeEach(() => {
    resetSiteSettingsStoreForTests();
    vi.restoreAllMocks();
  });

  it("returns defaults before the API load completes", () => {
    expect(getHeaderSettings()).toEqual(DEFAULT_HEADER_SETTINGS);
  });

  it("writes to the in-memory store and notifies listeners", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeHeaderSettings(listener);

    setHeaderSettings({
      name: "John Doe",
      title: "Lean Coach",
      bookingUrl: "https://example.com/rdv",
    });

    expect(getHeaderSettings()).toEqual({
      name: "John Doe",
      title: "Lean Coach",
      bookingUrl: "https://example.com/rdv",
    });
    expect(listener).toHaveBeenCalled();
    unsubscribe();
  });

  it("returns defaults on server snapshot", () => {
    expect(getHeaderSettingsServer()).toEqual(DEFAULT_HEADER_SETTINGS);
  });
});
