import { act, renderHook, waitFor } from "@testing-library/react";
import type { ChangeEvent, FormEvent } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useReferencesManager } from "./useReferencesManager";

const originalSessionStorage = window.sessionStorage;

function setupSessionStorage(initialToken = "token") {
  const store = new Map<string, string>();
  if (initialToken) {
    store.set("access_token", initialToken);
  }
  Object.defineProperty(window, "sessionStorage", {
    value: {
      getItem: (key: string) => store.get(key) || null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
    },
    configurable: true,
  });
  return store;
}

afterEach(() => {
  Object.defineProperty(window, "sessionStorage", {
    value: originalSessionStorage,
    configurable: true,
  });
  vi.restoreAllMocks();
});

describe("useReferencesManager", () => {
  it("stores modal errors instead of page errors when the form is open", async () => {
    setupSessionStorage();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue([]),
      }),
    );

    const { result } = renderHook(() =>
      useReferencesManager({ apiBase: "http://example.test", onRequestLogin: vi.fn() }),
    );

    await waitFor(() => {
      expect(result.current.status).toBe("idle");
    });

    act(() => {
      result.current.openCreateModal();
    });
    await waitFor(() => {
      expect(result.current.modalOpen).toBe(true);
    });

    await act(async () => {
      await result.current.onSubmit({ preventDefault() {} } as FormEvent<HTMLFormElement>);
    });

    expect(result.current.modalError).toBe("Référence et image sont obligatoires.");
    expect(result.current.status).toBe("idle");
    expect(result.current.errorMsg).toBe("");
  });

  it("normalizes edit form fallbacks for optional reference fields", async () => {
    setupSessionStorage();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue([]),
      }),
    );

    const { result } = renderHook(() =>
      useReferencesManager({ apiBase: "http://example.test", onRequestLogin: vi.fn() }),
    );

    await waitFor(() => {
      expect(result.current.status).toBe("idle");
    });

    act(() => {
      result.current.onRowClick({
        id: 1,
        order_index: 1,
        reference: "Ref A",
        reference_short: undefined as unknown as string,
        image: undefined as unknown as string,
        image_thumb: undefined as unknown as string,
        icon: undefined as unknown as string,
        situation: undefined as unknown as string,
        tasks: undefined as unknown as string[],
        actions: undefined as unknown as string[],
        results: undefined as unknown as string[],
      });
    });

    expect(result.current.isEditing).toBe(true);
    expect(result.current.form.referenceShort).toBe("");
    expect(result.current.form.image).toBe("");
    expect(result.current.form.imageThumb).toBe("");
    expect(result.current.form.icon).toBe("");
    expect(result.current.form.situation).toBe("");
    expect(result.current.form.tasks).toBe("");
    expect(result.current.form.actions).toBe("");
    expect(result.current.form.results).toBe("");
  });

  it("toggles all selections on and off", async () => {
    setupSessionStorage();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue([
          {
            id: 1,
            order_index: 1,
            reference: "Ref A",
            reference_short: "",
            image: "/media/ref-a.webp",
            image_thumb: "",
            icon: "",
            situation: "",
            tasks: [],
            actions: [],
            results: [],
          },
          {
            id: 2,
            order_index: 2,
            reference: "Ref B",
            reference_short: "",
            image: "/media/ref-b.webp",
            image_thumb: "",
            icon: "",
            situation: "",
            tasks: [],
            actions: [],
            results: [],
          },
        ]),
      }),
    );

    const { result } = renderHook(() =>
      useReferencesManager({ apiBase: "http://example.test", onRequestLogin: vi.fn() }),
    );

    await waitFor(() => {
      expect(result.current.items).toHaveLength(2);
    });

    act(() => {
      result.current.toggleAll(true);
    });
    expect(Array.from(result.current.selectedIds)).toEqual([1, 2]);

    act(() => {
      result.current.toggleAll(false);
    });
    expect(result.current.selectedIds.size).toBe(0);
  });

  it("reports unexpected load failures", async () => {
    setupSessionStorage();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue("boom"));

    const { result } = renderHook(() =>
      useReferencesManager({ apiBase: "http://example.test", onRequestLogin: vi.fn() }),
    );

    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });
    expect(result.current.errorMsg).toBe("Erreur inattendue");
  });

  it("reports API fallback messages for delete, submit and upload", async () => {
    setupSessionStorage();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([
          {
            id: 1,
            order_index: 1,
            reference: "Ref A",
            reference_short: "",
            image: "/media/ref.webp",
            image_thumb: "",
            icon: "",
            situation: "",
            tasks: [],
            actions: [],
            results: [],
          },
        ]),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: vi.fn().mockResolvedValue(""),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: vi.fn().mockResolvedValue(""),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: vi.fn().mockResolvedValue(""),
      });

    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() =>
      useReferencesManager({ apiBase: "http://example.test", onRequestLogin: vi.fn() }),
    );

    await waitFor(() => {
      expect(result.current.items).toHaveLength(1);
    });

    act(() => {
      result.current.toggleSelected(1, true);
    });
    await act(async () => {
      await result.current.onDeleteSelected();
    });
    expect(result.current.errorMsg).toBe("Erreur API (500)");

    act(() => {
      result.current.openCreateModal();
      result.current.setForm((prev) => ({
        ...prev,
        reference: "Ref B",
        image: "/media/ref-b.webp",
      }));
    });
    await waitFor(() => {
      expect(result.current.modalOpen).toBe(true);
    });
    await act(async () => {
      await result.current.onSubmit({ preventDefault() {} } as FormEvent<HTMLFormElement>);
    });
    expect(result.current.modalError).toBe("Erreur API (500)");

    await act(async () => {
      await result.current.onImageChange({
        target: {
          files: [new File(["x"], "image.png", { type: "image/png" })],
          value: "fake",
        },
      } as unknown as ChangeEvent<HTMLInputElement>);
    });
    expect(result.current.modalError).toBe("Erreur API (500)");
  });

  it("requests login on delete 401 and handles upload success for image and icon", async () => {
    setupSessionStorage();
    const onRequestLogin = vi.fn();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([
          {
            id: 1,
            order_index: 1,
            reference: "Ref A",
            reference_short: "",
            image: "/media/ref.webp",
            image_thumb: "",
            icon: "",
            situation: "",
            tasks: [],
            actions: [],
            results: [],
          },
        ]),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: vi.fn().mockResolvedValue("Unauthorized"),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          url: "http://example.test/media/references/ref.webp",
          thumbnail_url: "http://example.test/media/references/thumb.webp",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          url: "http://example.test/media/references/icon.webp",
        }),
      });

    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() =>
      useReferencesManager({ apiBase: "http://example.test", onRequestLogin }),
    );

    await waitFor(() => {
      expect(result.current.items).toHaveLength(1);
    });

    act(() => {
      result.current.toggleSelected(1, true);
    });
    await act(async () => {
      await result.current.onDeleteSelected();
    });
    expect(onRequestLogin).toHaveBeenCalled();

    await act(async () => {
      await result.current.onImageChange({
        target: {
          files: [new File(["x"], "image.png", { type: "image/png" })],
          value: "fake",
        },
      } as unknown as ChangeEvent<HTMLInputElement>);
    });
    expect(result.current.form.image).toBe("http://example.test/media/references/ref.webp");
    expect(result.current.form.imageThumb).toBe("http://example.test/media/references/thumb.webp");

    await act(async () => {
      await result.current.onIconChange({
        target: {
          files: [new File(["x"], "icon.png", { type: "image/png" })],
          value: "fake",
        },
      } as unknown as ChangeEvent<HTMLInputElement>);
    });
    expect(result.current.form.icon).toBe("http://example.test/media/references/icon.webp");
  });

  it("reports unexpected upload failures", async () => {
    setupSessionStorage();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([]),
      })
      .mockRejectedValueOnce("boom");

    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() =>
      useReferencesManager({ apiBase: "http://example.test", onRequestLogin: vi.fn() }),
    );

    await waitFor(() => {
      expect(result.current.status).toBe("idle");
    });

    await act(async () => {
      await result.current.onImageChange({
        target: {
          files: [new File(["x"], "image.png", { type: "image/png" })],
          value: "fake",
        },
      } as unknown as ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.errorMsg || result.current.modalError).toBe("Erreur inattendue");
  });

  it("reports unexpected submit failures inside the modal", async () => {
    setupSessionStorage();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([]),
      })
      .mockRejectedValueOnce("boom");

    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() =>
      useReferencesManager({ apiBase: "http://example.test", onRequestLogin: vi.fn() }),
    );

    await waitFor(() => {
      expect(result.current.status).toBe("idle");
    });

    act(() => {
      result.current.openCreateModal();
      result.current.setForm((prev) => ({
        ...prev,
        reference: "Ref C",
        image: "/media/ref-c.webp",
      }));
    });
    await waitFor(() => {
      expect(result.current.modalOpen).toBe(true);
    });

    await act(async () => {
      await result.current.onSubmit({ preventDefault() {} } as FormEvent<HTMLFormElement>);
    });

    expect(result.current.modalError).toBe("Erreur inattendue");
  });

  it("reports unexpected delete failures and ignores delete without selection", async () => {
    setupSessionStorage();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([
          {
            id: 1,
            order_index: 1,
            reference: "Ref A",
            reference_short: "",
            image: "/media/ref-a.webp",
            image_thumb: "",
            icon: "",
            situation: "",
            tasks: [],
            actions: [],
            results: [],
          },
        ]),
      })
      .mockRejectedValueOnce("boom");

    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() =>
      useReferencesManager({ apiBase: "http://example.test", onRequestLogin: vi.fn() }),
    );

    await waitFor(() => {
      expect(result.current.items).toHaveLength(1);
    });

    await act(async () => {
      await result.current.onDeleteSelected();
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.toggleSelected(1, true);
    });
    await act(async () => {
      await result.current.onDeleteSelected();
    });

    expect(result.current.errorMsg).toBe("Erreur inattendue");
  });

  it("reports unexpected move failures and updates an existing item in edit mode", async () => {
    setupSessionStorage();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([
          {
            id: 1,
            order_index: 1,
            reference: "Ref A",
            reference_short: "",
            image: "/media/ref-a.webp",
            image_thumb: "",
            icon: "",
            situation: "",
            tasks: [],
            actions: [],
            results: [],
          },
          {
            id: 2,
            order_index: 2,
            reference: "Ref B",
            reference_short: "",
            image: "/media/ref-b.webp",
            image_thumb: "",
            icon: "",
            situation: "",
            tasks: [],
            actions: [],
            results: [],
          },
        ]),
      })
      .mockRejectedValueOnce("boom")
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([
          {
            id: 1,
            order_index: 1,
            reference: "Ref A",
            reference_short: "",
            image: "/media/ref-a.webp",
            image_thumb: "",
            icon: "",
            situation: "",
            tasks: [],
            actions: [],
            results: [],
          },
          {
            id: 2,
            order_index: 2,
            reference: "Ref B",
            reference_short: "",
            image: "/media/ref-b.webp",
            image_thumb: "",
            icon: "",
            situation: "",
            tasks: [],
            actions: [],
            results: [],
          },
        ]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          id: 2,
          order_index: 2,
          reference: "Ref B+",
          reference_short: "",
          image: "/media/ref-b.webp",
          image_thumb: "",
          icon: "",
          situation: "",
          tasks: [],
          actions: [],
          results: [],
        }),
      });

    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() =>
      useReferencesManager({ apiBase: "http://example.test", onRequestLogin: vi.fn() }),
    );

    await waitFor(() => {
      expect(result.current.items).toHaveLength(2);
    });

    await act(async () => {
      await result.current.moveItem(0, "down");
    });
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "http://example.test/api/contact/references/admin/1",
        expect.objectContaining({
          method: "PATCH",
        }),
      );
    });
    await waitFor(() => {
      expect(result.current.items).toHaveLength(2);
    });

    act(() => {
      result.current.onRowClick(result.current.items[1]);
      result.current.setForm((prev) => ({ ...prev, reference: "Ref B+" }));
    });
    await waitFor(() => {
      expect(result.current.isEditing).toBe(true);
    });

    await act(async () => {
      await result.current.onSubmit({ preventDefault() {} } as FormEvent<HTMLFormElement>);
    });

    expect(result.current.items.some((item) => item.reference === "Ref B+")).toBe(true);
  });
});
