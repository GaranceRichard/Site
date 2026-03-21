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
  it("reports missing API base and missing auth token during load", async () => {
    const onRequestLogin = vi.fn();

    const { result: missingApiBase } = renderHook(() =>
      useReferencesManager({ apiBase: undefined, onRequestLogin }),
    );

    await waitFor(() => {
      expect(missingApiBase.current.status).toBe("error");
    });
    expect(missingApiBase.current.errorMsg).toBe(
      "Configuration manquante : NEXT_PUBLIC_API_BASE_URL.",
    );

    setupSessionStorage("");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { result: missingToken } = renderHook(() =>
      useReferencesManager({ apiBase: "http://example.test", onRequestLogin }),
    );

    await waitFor(() => {
      expect(missingToken.current.status).toBe("error");
    });
    expect(missingToken.current.errorMsg).toBe(
      "Connexion requise pour accéder aux références.",
    );
    expect(onRequestLogin).toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("requests login when load returns unauthorized and supports empty optional arrays", async () => {
    setupSessionStorage();
    const onRequestLogin = vi.fn();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: vi.fn().mockResolvedValue("Unauthorized"),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() =>
      useReferencesManager({ apiBase: "http://example.test", onRequestLogin }),
    );

    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });
    expect(result.current.errorMsg).toBe(
      "Connexion requise pour accéder aux références.",
    );
    expect(onRequestLogin).toHaveBeenCalled();

    act(() => {
      result.current.onRowClick({
        id: 1,
        order_index: 1,
        reference: "Ref empty arrays",
        reference_short: "",
        image: "/media/ref.webp",
        image_thumb: "",
        icon: "",
        situation: "",
        tasks: undefined,
        actions: undefined,
        results: undefined,
      });
    });

    expect(result.current.form.tasks).toBe("");
    expect(result.current.form.actions).toBe("");
    expect(result.current.form.results).toBe("");
  });

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

  it("surfaces API load errors with fallback text", async () => {
    setupSessionStorage();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: vi.fn().mockResolvedValue(""),
      }),
    );

    const { result } = renderHook(() =>
      useReferencesManager({ apiBase: "http://example.test", onRequestLogin: vi.fn() }),
    );

    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });
    expect(result.current.errorMsg).toBe("Erreur API (500)");
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

  it("ignores invalid move targets and requests login when move auth is missing", async () => {
    setupSessionStorage();
    const onRequestLogin = vi.fn();
    const fetchMock = vi.fn().mockResolvedValueOnce({
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
    });

    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() =>
      useReferencesManager({ apiBase: "http://example.test", onRequestLogin }),
    );

    await waitFor(() => {
      expect(result.current.items).toHaveLength(2);
    });

    await act(async () => {
      await result.current.moveItem(0, "up");
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    setupSessionStorage("");
    await act(async () => {
      await result.current.moveItem(0, "down");
    });

    expect(result.current.errorMsg).toBe(
      "Connexion requise pour accéder aux références.",
    );
    expect(onRequestLogin).toHaveBeenCalled();
  });

  it("restores list after move API failures on either patch request", async () => {
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
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: vi.fn().mockResolvedValue(""),
      })
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
        status: 200,
        text: vi.fn(),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: vi.fn().mockResolvedValue(""),
      })
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
      expect(result.current.items.map((item) => item.reference)).toEqual([
        "Ref A",
        "Ref B",
      ]);
    });

    await act(async () => {
      await result.current.moveItem(0, "down");
    });
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(6);
    });
  });

  it("closes the modal after deleting the edited reference", async () => {
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
      .mockResolvedValueOnce({
        ok: true,
        status: 204,
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
      result.current.onRowClick(result.current.items[0]);
      result.current.toggleSelected(1, true);
    });
    await waitFor(() => {
      expect(result.current.modalOpen).toBe(true);
    });

    await act(async () => {
      await result.current.onDeleteSelected();
    });

    expect(result.current.modalOpen).toBe(false);
    expect(result.current.form.reference).toBe("");
    expect(result.current.selectedIds.size).toBe(0);
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

  it("reports missing API base and missing auth token during submit", async () => {
    const onRequestLogin = vi.fn();
    const { result: missingApiBase } = renderHook(() =>
      useReferencesManager({ apiBase: undefined, onRequestLogin }),
    );

    act(() => {
      missingApiBase.current.openCreateModal();
      missingApiBase.current.setForm((prev) => ({
        ...prev,
        reference: "Ref submit",
        image: "/media/ref.webp",
      }));
    });

    await act(async () => {
      await missingApiBase.current.onSubmit({
        preventDefault() {},
      } as FormEvent<HTMLFormElement>);
    });
    expect(missingApiBase.current.errorMsg).toBe(
      "Configuration manquante : NEXT_PUBLIC_API_BASE_URL.",
    );

    setupSessionStorage("");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { result: missingToken } = renderHook(() =>
      useReferencesManager({ apiBase: "http://example.test", onRequestLogin }),
    );

    act(() => {
      missingToken.current.openCreateModal();
      missingToken.current.setForm((prev) => ({
        ...prev,
        reference: "Ref submit",
        image: "/media/ref.webp",
      }));
    });
    await waitFor(() => {
      expect(missingToken.current.modalOpen).toBe(true);
    });

    await act(async () => {
      await missingToken.current.onSubmit({
        preventDefault() {},
      } as FormEvent<HTMLFormElement>);
    });

    expect(missingToken.current.modalError).toBe(
      "Connexion requise pour accéder aux références.",
    );
    expect(onRequestLogin).toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("requests login when submit is unauthorized", async () => {
    setupSessionStorage();
    const onRequestLogin = vi.fn();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([]),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: vi.fn().mockResolvedValue("Forbidden"),
      });

    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() =>
      useReferencesManager({ apiBase: "http://example.test", onRequestLogin }),
    );

    await waitFor(() => {
      expect(result.current.status).toBe("idle");
    });

    act(() => {
      result.current.openCreateModal();
      result.current.setForm((prev) => ({
        ...prev,
        reference: "Ref submit",
        image: "/media/ref.webp",
      }));
    });

    await act(async () => {
      await result.current.onSubmit({ preventDefault() {} } as FormEvent<HTMLFormElement>);
    });

    expect(result.current.modalError).toBe(
      "Connexion requise pour accéder aux références.",
    );
    expect(onRequestLogin).toHaveBeenCalled();
  });

  it("reports missing API base, missing auth and missing upload URL during uploads", async () => {
    const onRequestLogin = vi.fn();
    const imageFile = new File(["x"], "image.png", { type: "image/png" });
    const iconFile = new File(["y"], "icon.png", { type: "image/png" });

    const { result: missingApiBase } = renderHook(() =>
      useReferencesManager({ apiBase: undefined, onRequestLogin }),
    );

    await act(async () => {
      await missingApiBase.current.onImageChange({
        target: { files: [imageFile], value: "fake" },
      } as unknown as ChangeEvent<HTMLInputElement>);
    });
    expect(missingApiBase.current.errorMsg).toBe(
      "Configuration manquante : NEXT_PUBLIC_API_BASE_URL.",
    );

    setupSessionStorage("");
    const fetchWithoutToken = vi.fn();
    vi.stubGlobal("fetch", fetchWithoutToken);
    const { result: missingToken } = renderHook(() =>
      useReferencesManager({ apiBase: "http://example.test", onRequestLogin }),
    );

    await act(async () => {
      await missingToken.current.onImageChange({
        target: { files: [imageFile], value: "fake" },
      } as unknown as ChangeEvent<HTMLInputElement>);
    });
    expect(missingToken.current.errorMsg).toBe(
      "Connexion requise pour accéder aux références.",
    );
    expect(fetchWithoutToken).not.toHaveBeenCalled();

    setupSessionStorage();
    const fetchMissingUrl = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ thumbnail_url: "/media/thumb.webp" }),
      });

    vi.stubGlobal("fetch", fetchMissingUrl);
    const { result: missingUrl } = renderHook(() =>
      useReferencesManager({ apiBase: "http://example.test", onRequestLogin: vi.fn() }),
    );

    await waitFor(() => {
      expect(missingUrl.current.status).toBe("idle");
    });

    await act(async () => {
      await missingUrl.current.onImageChange({
        target: { files: [imageFile], value: "fake" },
      } as unknown as ChangeEvent<HTMLInputElement>);
    });
    expect(missingUrl.current.errorMsg).toBe("URL d'image manquante.");

    await act(async () => {
      await missingUrl.current.onIconChange({
        target: { files: [iconFile], value: "fake" },
      } as unknown as ChangeEvent<HTMLInputElement>);
    });
  });

  it("ignores empty upload change events", async () => {
    setupSessionStorage();
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue([]),
    });

    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() =>
      useReferencesManager({ apiBase: "http://example.test", onRequestLogin: vi.fn() }),
    );

    await waitFor(() => {
      expect(result.current.status).toBe("idle");
    });

    act(() => {
      result.current.onImageChange({
        target: { files: [], value: "fake" },
      } as unknown as ChangeEvent<HTMLInputElement>);
      result.current.onIconChange({
        target: { files: [], value: "fake" },
      } as unknown as ChangeEvent<HTMLInputElement>);
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
