import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("references lib cache", () => {
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

  it("throws when NEXT_PUBLIC_API_BASE_URL is missing", async () => {
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue([]),
    });
    vi.stubGlobal("fetch", fetchMock);
    const { fetchReferencesOnce } = await import("./references");
    await expect(fetchReferencesOnce()).resolves.toEqual([]);
    expect(fetchMock).toHaveBeenCalledWith("/api-proxy/api/contact/references");
  });

  it("sorts by order_index and caches response", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://example.test";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue([
        { id: 2, order_index: 2 },
        { id: 1, order_index: 1 },
      ]),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { fetchReferencesOnce } = await import("./references");
    const first = await fetchReferencesOnce();
    const second = await fetchReferencesOnce();

    expect(first.map((i) => i.id)).toEqual([1, 2]);
    expect(second.map((i) => i.id)).toEqual([1, 2]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/api-proxy/api/contact/references");
  });

  it("deduplicates concurrent requests using pending promise", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://example.test";
    const deferred = (() => {
      let resolve: (value: unknown) => void;
      const promise = new Promise((res) => {
        resolve = res;
      });
      return { promise, resolve: resolve! };
    })();

    const fetchMock = vi.fn().mockReturnValue(deferred.promise);
    vi.stubGlobal("fetch", fetchMock);

    const { fetchReferencesOnce } = await import("./references");
    const p1 = fetchReferencesOnce();
    const p2 = fetchReferencesOnce();

    deferred.resolve({
      ok: true,
      json: vi.fn().mockResolvedValue([{ id: 1, order_index: 1 }]),
    });

    await expect(Promise.all([p1, p2])).resolves.toHaveLength(2);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("throws on non-ok response and returns [] for non-array payload", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://example.test";

    const failFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });
    vi.stubGlobal("fetch", failFetch);
    const failedModule = await import("./references");
    await expect(failedModule.fetchReferencesOnce()).rejects.toThrow("Erreur API (500)");

    vi.resetModules();
    const okFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ not: "array" }),
    });
    vi.stubGlobal("fetch", okFetch);
    const okModule = await import("./references");
    await expect(okModule.fetchReferencesOnce()).resolves.toEqual([]);
  });

  it("invalidates cache and re-fetches", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://example.test";
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([{ id: 1, order_index: 1 }]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([{ id: 2, order_index: 1 }]),
      });
    vi.stubGlobal("fetch", fetchMock);

    const { fetchReferencesOnce, invalidateReferencesCache } = await import("./references");

    const first = await fetchReferencesOnce();
    invalidateReferencesCache();
    const second = await fetchReferencesOnce();

    expect(first[0].id).toBe(1);
    expect(second[0].id).toBe(2);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("throws when api base resolver returns undefined", async () => {
    vi.doMock("./backoffice", () => ({
      resolveApiBaseUrl: () => undefined,
    }));

    const { fetchReferencesOnce } = await import("./references");

    await expect(fetchReferencesOnce()).rejects.toThrow(
      "Configuration manquante : NEXT_PUBLIC_API_BASE_URL."
    );
  });

  it("returns static demo references without calling fetch", async () => {
    process.env.NEXT_PUBLIC_DEMO_MODE = "true";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { fetchReferencesOnce } = await import("./references");
    const data = await fetchReferencesOnce();

    expect(data.length).toBeGreaterThan(0);
    expect(data[0]?.reference).toBe("Les Castas");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
