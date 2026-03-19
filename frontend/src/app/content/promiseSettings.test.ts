import { describe, expect, it, vi } from "vitest";

vi.mock("./siteSettingsStore", () => ({
  DEFAULT_PROMISE_SETTINGS: { title: "Default title", subtitle: "Default subtitle", cards: [] },
  getSiteSettings: vi.fn(() => ({
    header: { name: "", title: "", bookingUrl: "" },
    homeHero: { eyebrow: "", title: "", subtitle: "", links: [], keywords: [], cards: [] },
    promise: { title: "Promise title", subtitle: "Promise subtitle", cards: [{ id: "1", title: "Card", content: "Body" }] },
  })),
  getSiteSettingsServer: vi.fn(() => ({
    header: { name: "", title: "", bookingUrl: "" },
    homeHero: { eyebrow: "", title: "", subtitle: "", links: [], keywords: [], cards: [] },
    promise: { title: "Server title", subtitle: "Server subtitle", cards: [] },
  })),
  setPromiseSettings: vi.fn(),
  subscribeSiteSettings: vi.fn((listener: () => void) => {
    listener();
    return () => "unsubscribed";
  }),
}));

import {
  DEFAULT_PROMISE_SETTINGS,
  getPromiseSettings,
  getPromiseSettingsServer,
  setPromiseSettings,
  subscribePromiseSettings,
} from "./promiseSettings";

describe("promiseSettings", () => {
  it("returns the client promise settings", () => {
    expect(getPromiseSettings()).toEqual({
      title: "Promise title",
      subtitle: "Promise subtitle",
      cards: [{ id: "1", title: "Card", content: "Body" }],
    });
  });

  it("returns the server promise settings", () => {
    expect(getPromiseSettingsServer()).toEqual({
      title: "Server title",
      subtitle: "Server subtitle",
      cards: [],
    });
  });

  it("re-exports the default settings and setter/subscription wrappers", () => {
    expect(DEFAULT_PROMISE_SETTINGS).toEqual({
      title: "Default title",
      subtitle: "Default subtitle",
      cards: [],
    });
    expect(typeof setPromiseSettings).toBe("function");

    const listener = vi.fn();
    const unsubscribe = subscribePromiseSettings(listener);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(unsubscribe()).toBe("unsubscribed");
  });
});
