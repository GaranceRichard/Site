import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("siteContent", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.resetModules();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("builds stable ascii slugs for content pages", async () => {
    const { slugifySegment } = await import("./siteContent");

    expect(slugifySegment("Clarifier avant d’accélérer")).toBe("clarifier-avant-daccelerer");
    expect(slugifySegment("Ministère de l'Emploi et de la Solidarité Sociale")).toBe(
      "ministere-de-lemploi-et-de-la-solidarite-sociale",
    );
  });

  it("falls back safely when the input cannot produce a slug", async () => {
    const { slugifySegment } = await import("./siteContent");

    expect(slugifySegment("   ")).toBe("item");
  });

  it("returns publications and references from the demo snapshot in demo mode", async () => {
    process.env.NEXT_PUBLIC_DEMO_MODE = "true";

    const {
      getPublicationPageSettings,
      getPublicationsPageEntries,
      getPublicationPageEntryBySlug,
      getReferencePageEntries,
      getReferencePageEntryBySlug,
    } = await import("./siteContent");

    const settings = await getPublicationPageSettings();
    const publications = await getPublicationsPageEntries();
    const references = await getReferencePageEntries();

    expect(settings.title).toBe("Points de vue");
    expect(settings.highlight.title).toBe("Pilotage par la preuve, arbitrages assumés");
    expect(publications.length).toBeGreaterThan(0);
    expect(publications[0]?.slug).toContain("arbitrer-avec-la-donnee");
    expect(publications[0]?.excerpt.length).toBeGreaterThan(20);
    await expect(getPublicationPageEntryBySlug(publications[0]!.slug)).resolves.toEqual(publications[0]);

    expect(references.length).toBeGreaterThan(0);
    expect(references[0]?.slug).toContain("ministere-de-lemploi-et-de-la-solidarite-sociale");
    expect(references[0]?.excerpt.length).toBeGreaterThan(10);
    await expect(getReferencePageEntryBySlug(references[0]!.slug)).resolves.toEqual(references[0]);
  });

  it("returns empty lookups when a slug does not exist", async () => {
    process.env.NEXT_PUBLIC_DEMO_MODE = "true";

    const { getPublicationPageEntryBySlug, getReferencePageEntryBySlug } = await import("./siteContent");

    await expect(getPublicationPageEntryBySlug("missing")).resolves.toBeNull();
    await expect(getReferencePageEntryBySlug("missing")).resolves.toBeNull();
  });

  it("loads and normalizes publications from the public API outside demo mode", async () => {
    process.env.NEXT_PUBLIC_DEMO_MODE = "false";
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://example.test";

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        publications: {
          title: "  Analyses  ",
          subtitle: "  Delivery et arbitrages  ",
          highlight: {
            title: "  Focus  ",
            content: "  Une ligne de cadrage  ",
          },
          items: [
            {
              id: "pub-1",
              title: "  Article API  ",
              content: "  Contenu de publication suffisamment long pour construire un extrait.  ",
              links: [
                {
                  title: "  Source  ",
                  url: "  https://example.test/source  ",
                },
              ],
            },
            {
              id: "pub-empty",
              title: " ",
              content: " ",
            },
          ],
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { getPublicationPageSettings, getPublicationsPageEntries } = await import("./siteContent");
    const settings = await getPublicationPageSettings();
    const items = await getPublicationsPageEntries();

    expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/api\/settings\/$/), {
      method: "GET",
      cache: "no-store",
    });
    expect(settings).toEqual({
      title: "Analyses",
      subtitle: "Delivery et arbitrages",
      highlight: {
        title: "Focus",
        content: "Une ligne de cadrage",
      },
    });
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: "pub-1",
      title: "Article API",
      slug: "article-api-1",
      links: [
        {
          id: "publication-link-1",
          title: "Source",
          url: "https://example.test/source",
        },
      ],
    });
  });

  it("filters invalid publication entries and link payloads from the API", async () => {
    process.env.NEXT_PUBLIC_DEMO_MODE = "false";
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://example.test";

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          publications: {
            title: "  ",
            subtitle: null,
            highlight: "invalid",
            items: [
              null,
              {
                title: " Publication longue ",
                content: "Un contenu très long ".repeat(20),
                links: [
                  null,
                  {
                    id: " custom-id ",
                    title: "  Lire  ",
                    url: "  https://example.test/read  ",
                  },
                  {
                    title: "Sans url",
                    url: " ",
                  },
                ],
              },
              {
                id: "only-id",
                title: " ",
                content: " ",
                links: "invalid",
              },
            ],
          },
        }),
      }),
    );

    const { getPublicationPageSettings, getPublicationsPageEntries } = await import("./siteContent");
    const settings = await getPublicationPageSettings();
    const items = await getPublicationsPageEntries();

    expect(settings).toEqual({
      title: "Publications",
      subtitle: "",
      highlight: {
        title: "",
        content: "",
      },
    });
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: "publication-2",
      title: "Publication longue",
      slug: "publication-longue-2",
      links: [
        {
          id: "custom-id",
          title: "Lire",
          url: "https://example.test/read",
        },
      ],
    });
    expect(items[0]?.excerpt.endsWith("...")).toBe(true);
  });

  it("falls back safely when the publications API fails", async () => {
    process.env.NEXT_PUBLIC_DEMO_MODE = "false";
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://example.test";

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
      }),
    );

    const { getPublicationPageSettings, getPublicationsPageEntries } = await import("./siteContent");

    await expect(getPublicationPageSettings()).resolves.toEqual({
      title: "Publications",
      subtitle: "",
      highlight: {
        title: "",
        content: "",
      },
    });
    await expect(getPublicationsPageEntries()).resolves.toEqual([]);
  });

  it("returns publication fallbacks when no api base is configured", async () => {
    process.env.NEXT_PUBLIC_DEMO_MODE = "false";
    delete process.env.NEXT_PUBLIC_API_BASE_URL;

    const { getPublicationPageSettings, getPublicationsPageEntries } = await import("./siteContent");

    await expect(getPublicationPageSettings()).resolves.toEqual({
      title: "Publications",
      subtitle: "",
      highlight: {
        title: "",
        content: "",
      },
    });
    await expect(getPublicationsPageEntries()).resolves.toEqual([]);
  });

  it("loads and sorts references from the public API outside demo mode", async () => {
    process.env.NEXT_PUBLIC_DEMO_MODE = "false";
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://example.test";

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: 2,
          reference: "B",
          reference_short: "",
          order_index: 2,
          image: "/media/references/b.webp",
          image_thumb: "",
          icon: "",
          situation: "Situation B",
          tasks: ["Task B"],
          actions: ["Action B"],
          results: ["Result B"],
        },
        {
          id: 1,
          reference: "A",
          reference_short: "A court",
          order_index: 1,
          image: "/media/references/a.webp",
          image_thumb: "/media/references/thumbs/a.webp",
          icon: "/media/references/icon-a.webp",
          situation: "Situation A",
          tasks: ["Task A"],
          actions: ["Action A"],
          results: ["Result A"],
        },
      ],
    });
    vi.stubGlobal("fetch", fetchMock);

    const { getReferencePageEntries } = await import("./siteContent");
    const items = await getReferencePageEntries();

    expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/api\/contact\/references$/), {
      method: "GET",
      cache: "no-store",
    });
    expect(items.map((item) => item.id)).toEqual([1, 2]);
    expect(items[0]).toMatchObject({
      reference: "A",
      slug: "a-1",
      image_thumb: "/media/references/thumbs/a.webp",
    });
    expect(items[1]?.image_thumb).toBeUndefined();
  });

  it("filters invalid references and falls back on missing arrays", async () => {
    process.env.NEXT_PUBLIC_DEMO_MODE = "false";
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://example.test";

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          null,
          {
            id: "bad-id",
            reference: " ",
            order_index: "bad-order",
            results: "invalid",
          },
          {
            reference: "Référence filtrée",
            situation: "  ",
            tasks: "invalid",
            actions: null,
            results: ["  ", "Résultat clé"],
            image: " /media/references/ref.webp ",
            icon: null,
          },
        ],
      }),
    );

    const { getReferencePageEntries, getReferencePageEntryBySlug } = await import("./siteContent");
    const items = await getReferencePageEntries();

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: 3,
      reference: "Référence filtrée",
      order_index: 3,
      image: "/media/references/ref.webp",
      icon: "",
      tasks: [],
      actions: [],
      results: ["Résultat clé"],
      excerpt: "Résultat clé",
      slug: "reference-filtree-3",
    });
    await expect(getReferencePageEntryBySlug("reference-filtree-3")).resolves.toEqual(items[0]);
  });

  it("returns an empty references list when the references API fails", async () => {
    process.env.NEXT_PUBLIC_DEMO_MODE = "false";
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://example.test";

    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network")),
    );

    const { getReferencePageEntries } = await import("./siteContent");

    await expect(getReferencePageEntries()).resolves.toEqual([]);
  });

  it("returns an empty references list when no api base is configured", async () => {
    process.env.NEXT_PUBLIC_DEMO_MODE = "false";
    delete process.env.NEXT_PUBLIC_API_BASE_URL;

    const { getReferencePageEntries } = await import("./siteContent");

    await expect(getReferencePageEntries()).resolves.toEqual([]);
  });
});
