import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_PROMISE_SETTINGS,
  getPromiseSettings,
  getPromiseSettingsServer,
  setPromiseSettings,
  subscribePromiseSettings,
} from "./promiseSettings";
import { resetSiteSettingsStoreForTests } from "./siteSettingsStore";

describe("promiseSettings", () => {
  beforeEach(() => {
    resetSiteSettingsStoreForTests();
    vi.restoreAllMocks();
  });

  it("returns defaults before the API load completes", () => {
    expect(getPromiseSettings()).toEqual(DEFAULT_PROMISE_SETTINGS);
  });

  it("writes to the in-memory store and notifies listeners", () => {
    const listener = vi.fn();
    const unsubscribe = subscribePromiseSettings(listener);

    setPromiseSettings({
      title: "Promise title",
      subtitle: "Promise subtitle",
      cards: [{ id: "1", title: "Card", content: "Body" }],
    });

    expect(getPromiseSettings()).toEqual({
      title: "Promise title",
      subtitle: "Promise subtitle",
      cards: [{ id: "1", title: "Card", content: "Body" }],
    });
    expect(listener).toHaveBeenCalled();
    unsubscribe();
  });

  it("returns defaults on server snapshot", () => {
    expect(getPromiseSettingsServer()).toEqual(DEFAULT_PROMISE_SETTINGS);
  });

  it("returns the unsubscribe function from the shared store subscription", () => {
    const listener = vi.fn();

    const unsubscribe = subscribePromiseSettings(listener);
    unsubscribe();

    setPromiseSettings({
      title: "After unsubscribe",
      subtitle: "No notify",
      cards: [{ id: "2", title: "Silent", content: "Listener removed" }],
    });

    expect(listener).not.toHaveBeenCalled();
  });
});
