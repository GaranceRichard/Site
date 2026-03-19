import { beforeEach, describe, expect, it, vi } from "vitest";

describe("analytics", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
    delete window.gtag;
    delete window.dataLayer;
    delete window.__gaInitialized;
    vi.resetModules();
  });

  it("isGaEnabled retourne false quand la variable est absente", async () => {
    delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

    const analyticsModule = await import("./analytics");

    expect(analyticsModule.isGaEnabled()).toBe(false);
  });

  it("isGaEnabled retourne true quand la variable est definie", async () => {
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = "G-TEST123";

    const analyticsModule = await import("./analytics");

    expect(analyticsModule.isGaEnabled()).toBe(true);
  });

  it("trackEvent est un no-op si gtag est absent", async () => {
    const { trackEvent } = await import("./analytics");

    expect(() => trackEvent("cta_click", { cta_label: "Contact" })).not.toThrow();
  });

  it("trackEvent appelle gtag si disponible", async () => {
    const { trackEvent } = await import("./analytics");
    const gtagMock = vi.fn();
    window.gtag = gtagMock;

    trackEvent("cta_click", { cta_label: "Contact" });

    expect(gtagMock).toHaveBeenCalledWith("event", "cta_click", {
      cta_label: "Contact",
    });
  });

  it("initGA retourne sans rien faire si measurementId est vide", async () => {
    const { initGA } = await import("./analytics");

    initGA("");

    expect(document.querySelector("#ga4-script")).toBeNull();
    expect(window.gtag).toBeUndefined();
  });

  it("initGA cree dataLayer et un gtag local si absent", async () => {
    const { initGA } = await import("./analytics");

    initGA("G-LOCAL123");

    expect(window.dataLayer).toBeDefined();
    expect(typeof window.gtag).toBe("function");
    expect(document.querySelectorAll("#ga4-script")).toHaveLength(1);
    expect(window.__gaInitialized).toBe("G-LOCAL123");
    expect(window.dataLayer).toEqual([
      ["js", expect.any(Date), undefined],
      ["config", "G-LOCAL123", { send_page_view: true }],
    ]);
  });

  it("initGA injecte le script et initialise gtag une seule fois avec un gtag existant", async () => {
    const { initGA } = await import("./analytics");
    const existingGtag = vi.fn();
    window.gtag = existingGtag;
    window.dataLayer = [];

    initGA("G-TEST123");
    initGA("G-TEST123");

    expect(document.querySelectorAll("#ga4-script")).toHaveLength(1);
    expect(existingGtag).toHaveBeenCalledWith("js", expect.any(Date));
    expect(existingGtag).toHaveBeenCalledWith("config", "G-TEST123", {
      send_page_view: true,
    });
    expect(existingGtag).toHaveBeenCalledTimes(2);
  });
});
