import { beforeEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_HEADER_SETTINGS } from "../content/siteSettingsSchema";
import { fetchPublicSiteSettings } from "./publicSiteSettings";

describe("publicSiteSettings", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("loads and normalizes public settings from the API", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "http://example.test");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          header: {
            name: "  Jane Doe  ",
            title: "  Delivery lead  ",
            bookingUrl: " https://example.test/book ",
          },
        }),
      }),
    );

    const settings = await fetchPublicSiteSettings();

    expect(settings.header).toEqual({
      name: "Jane Doe",
      title: "Delivery lead",
      bookingUrl: "https://example.test/book",
    });
  });

  it("uses the demo snapshot in demo mode", async () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "true");

    const settings = await fetchPublicSiteSettings();

    expect(settings.header.title).toBe("Delivery & Transformation");
  });

  it("falls back to normalized defaults when the fetch fails", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "http://example.test");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));

    const settings = await fetchPublicSiteSettings();

    expect(settings.header).toEqual(DEFAULT_HEADER_SETTINGS);
  });

  it("falls back to normalized defaults when no api base is configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "");

    const settings = await fetchPublicSiteSettings();

    expect(settings.header).toEqual(DEFAULT_HEADER_SETTINGS);
  });

  it("falls back to normalized defaults when the response is not ok", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "http://example.test");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
      }),
    );

    const settings = await fetchPublicSiteSettings();

    expect(settings.header).toEqual(DEFAULT_HEADER_SETTINGS);
  });

  it("falls back to normalized defaults when api base resolution returns nothing", async () => {
    vi.resetModules();
    vi.doMock("./backoffice", async () => {
      const actual = await vi.importActual<typeof import("./backoffice")>("./backoffice");
      return {
        ...actual,
        resolveApiBaseUrl: () => undefined,
      };
    });

    const { fetchPublicSiteSettings: fetchWithMissingBase } = await import("./publicSiteSettings");
    const settings = await fetchWithMissingBase();

    expect(settings.header).toEqual(DEFAULT_HEADER_SETTINGS);
  });
});
