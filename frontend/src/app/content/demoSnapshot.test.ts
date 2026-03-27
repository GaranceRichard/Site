import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("demoSnapshot", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it("returns normalized settings and ordered references from the snapshot", async () => {
    const demoSnapshotModule = await import("./demoSnapshot");

    const settings = demoSnapshotModule.getDemoSiteSettings();
    const references = demoSnapshotModule.getDemoReferences();

    expect(settings.header.name).toBeTruthy();
    expect(references.length).toBeGreaterThan(0);
    expect(references[0]!.order_index).toBeLessThanOrEqual(
      references[references.length - 1]!.order_index,
    );
  });

  it("falls back safely when snapshot content is malformed", async () => {
    vi.doMock("./demoSnapshot.json", () => ({
      default: {
        settings: null,
        references: [
          {
            id: Number.NaN,
            reference: "  Demo reference  ",
            reference_short: null,
            order_index: Number.NaN,
            image: "  /media/references/demo.webp  ",
            image_thumb: null,
            icon: undefined,
            situation: "  Situation  ",
            tasks: ["  Task  ", "", null],
            actions: "invalid",
            results: ["  Result  "],
          },
          {
            id: 2,
            reference: "   ",
            reference_short: "Ignored",
            order_index: 0,
            image: "",
            icon: "",
            situation: "",
            tasks: [],
            actions: [],
            results: [],
          },
        ],
      },
    }));

    const demoSnapshotModule = await import("./demoSnapshot");
    const references = demoSnapshotModule.getDemoReferences();

    expect(demoSnapshotModule.getDemoSiteSettings().header.name).toBeTruthy();
    expect(references).toEqual([
      {
        id: 1,
        reference: "Demo reference",
        reference_short: "",
        order_index: 1,
        image: "/media/references/demo.webp",
        image_thumb: "",
        icon: "",
        situation: "Situation",
        tasks: ["Task"],
        actions: [],
        results: ["Result"],
      },
    ]);
  });

  it("returns an empty references list when the snapshot has no array", async () => {
    vi.doMock("./demoSnapshot.json", () => ({
      default: {
        settings: {},
        references: null,
      },
    }));

    const demoSnapshotModule = await import("./demoSnapshot");

    expect(demoSnapshotModule.getDemoReferences()).toEqual([]);
  });
});
