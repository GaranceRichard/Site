import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_METHOD_SETTINGS,
  getMethodSettings,
  getMethodSettingsServer,
  setMethodSettings,
  subscribeMethodSettings,
} from "./methodSettings";
import { resetSiteSettingsStoreForTests } from "./siteSettingsStore";

describe("methodSettings", () => {
  beforeEach(() => {
    resetSiteSettingsStoreForTests();
    vi.restoreAllMocks();
  });

  it("returns defaults before the API load completes", () => {
    expect(getMethodSettings()).toEqual(DEFAULT_METHOD_SETTINGS);
  });

  it("writes to the in-memory store and notifies listeners", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeMethodSettings(listener);

    setMethodSettings({
      eyebrow: "Approche",
      title: "Un nouveau cadre",
      subtitle: "On clarifie puis on stabilise.",
      steps: [{ id: "1", step: "01", title: "Observer", text: "Comprendre." }],
    });

    expect(getMethodSettings()).toEqual({
      eyebrow: "Approche",
      title: "Un nouveau cadre",
      subtitle: "On clarifie puis on stabilise.",
      steps: [{ id: "1", step: "01", title: "Observer", text: "Comprendre." }],
    });
    expect(listener).toHaveBeenCalled();
    unsubscribe();
  });

  it("returns defaults on server snapshot", () => {
    expect(getMethodSettingsServer()).toEqual(DEFAULT_METHOD_SETTINGS);
  });

  it("returns the unsubscribe function from the shared store subscription", () => {
    const listener = vi.fn();

    const unsubscribe = subscribeMethodSettings(listener);
    unsubscribe();

    setMethodSettings({
      eyebrow: "Approche",
      title: "After unsubscribe",
      subtitle: "No notify",
      steps: [{ id: "2", step: "02", title: "Choisir", text: "Prioriser." }],
    });

    expect(listener).not.toHaveBeenCalled();
  });
});
