import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  DEFAULT_METADATA_HEADER,
  DEFAULT_METADATA_KEYWORDS,
  DEFAULT_OPEN_GRAPH_DESCRIPTION,
  DEFAULT_TWITTER_DESCRIPTION,
  buildMetadataTitle,
  fetchMetadataHeader,
  getMetadataBackendOrigin,
  normalizeMetadataHeader,
} from "./siteMetadata";

describe("siteMetadata", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("builds the tab title from the header name and title", () => {
    expect(buildMetadataTitle({ name: "Jane Doe", title: "Agile Coach" })).toBe("Jane Doe | Agile Coach");
  });

  it("avoids duplicating the name when title matches it", () => {
    expect(buildMetadataTitle({ name: "Jane Doe", title: "Jane Doe" })).toBe("Jane Doe");
  });

  it("normalizes invalid header payloads with defaults", () => {
    expect(normalizeMetadataHeader({ name: "  Jane Doe  ", title: "" })).toEqual({
      name: "Jane Doe",
      title: DEFAULT_METADATA_HEADER.title,
    });
  });

  it("returns defaults when the header payload is not an object", () => {
    expect(normalizeMetadataHeader(null)).toEqual(DEFAULT_METADATA_HEADER);
  });

  it("falls back to the default name when the header name is blank", () => {
    expect(normalizeMetadataHeader({ name: " ", title: "Agile Coach" })).toEqual({
      name: DEFAULT_METADATA_HEADER.name,
      title: "Agile Coach",
    });
  });

  it("exposes metadata copy aligned with delivery and transformation", () => {
    expect(DEFAULT_METADATA_KEYWORDS).toEqual([
      "delivery transformation",
      "directeur de projet",
      "pilotage de delivery",
      "capacite a livrer",
      "arbitrages",
      "gouvernance d'execution",
      "priorisation",
      "stabilisation de l'execution",
      "transformation organisationnelle",
      "garance richard",
    ]);
    expect(DEFAULT_OPEN_GRAPH_DESCRIPTION).toBe(
      "Clarifier les priorites, objectiver les arbitrages et remettre l'execution sous controle dans des environnements complexes.",
    );
    expect(DEFAULT_TWITTER_DESCRIPTION).toBe(
      "Delivery & Transformation : priorites clarifiees, arbitrages explicites, capacite a livrer securisee.",
    );
  });

  it("builds the backend origin from the configured API base", () => {
    expect(getMetadataBackendOrigin(" http://example.test/ ")).toBe("http://example.test");
    expect(getMetadataBackendOrigin("")).toBe("http://127.0.0.1:8000");
  });

  it("fetches and normalizes public header settings", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          header: {
            name: "  Jane Doe  ",
            title: "  Agile Coach  ",
          },
        }),
      }),
    );

    await expect(fetchMetadataHeader()).resolves.toEqual({
      name: "Jane Doe",
      title: "Agile Coach",
    });
  });

  it("uses the demo snapshot header in demo mode", async () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "true");

    await expect(fetchMetadataHeader()).resolves.toEqual({
      name: "Garance Richard",
      title: "Delivery & Transformation",
    });
  });

  it("falls back to defaults when the public settings fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));

    await expect(fetchMetadataHeader()).resolves.toEqual(DEFAULT_METADATA_HEADER);
  });

  it("falls back to defaults when the public settings response is not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
      }),
    );

    await expect(fetchMetadataHeader()).resolves.toEqual(DEFAULT_METADATA_HEADER);
  });
});
