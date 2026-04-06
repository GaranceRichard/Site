import { act, renderHook } from "@testing-library/react";
import type { FormEvent } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useSettingsManager } from "./useSettingsManager";

function createStore<T>(initialValue: T) {
  let value = initialValue;
  const listeners = new Set<() => void>();

  return {
    getSnapshot: () => value,
    getServerSnapshot: () => value,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    set(nextValue: T) {
      value = nextValue;
      for (const listener of listeners) {
        listener();
      }
    },
  };
}

describe("useSettingsManager", () => {
  afterEach(() => {
    window.sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("syncs form state from the persisted store", () => {
    const store = createStore({ title: "Initial" });

    const { result } = renderHook(() =>
      useSettingsManager({
        subscribe: store.subscribe,
        getSnapshot: store.getSnapshot,
        getServerSnapshot: store.getServerSnapshot,
        initialTab: "titles" as const,
        normalizeForSubmit: (form: { title: string }) => form,
        save: vi.fn(),
        successMessage: "Saved",
        fallbackErrorMessage: "Fallback",
      }),
    );

    expect(result.current.form).toEqual({ title: "Initial" });

    act(() => {
      store.set({ title: "Updated" });
    });

    expect(result.current.form).toEqual({ title: "Updated" });
  });

  it("supports mapping persisted data to a dedicated form state", () => {
    const store = createStore({ title: "Initial", items: [{ name: "A" }] });

    const { result } = renderHook(() =>
      useSettingsManager({
        subscribe: store.subscribe,
        getSnapshot: store.getSnapshot,
        getServerSnapshot: store.getServerSnapshot,
        initialTab: "titles" as const,
        mapPersistedToForm: (persisted: { title: string; items: { name: string }[] }) => ({
          title: persisted.title,
          count: persisted.items.length,
        }),
        normalizeForSubmit: (form: { title: string; count: number }) => form,
        save: vi.fn(),
        successMessage: "Saved",
        fallbackErrorMessage: "Fallback",
      }),
    );

    expect(result.current.form).toEqual({ title: "Initial", count: 1 });
  });

  it("blocks submit on validation error before saving", async () => {
    const store = createStore({ title: "" });
    const save = vi.fn();

    const { result } = renderHook(() =>
      useSettingsManager({
        subscribe: store.subscribe,
        getSnapshot: store.getSnapshot,
        getServerSnapshot: store.getServerSnapshot,
        initialTab: "titles" as const,
        normalizeForSubmit: (form: { title: string }) => form,
        save,
        successMessage: "Saved",
        fallbackErrorMessage: "Fallback",
        validate: (normalized: { title: string }) =>
          normalized.title.trim() ? null : "Titre obligatoire.",
      }),
    );

    await act(async () => {
      await result.current.onSubmit({
        preventDefault() {},
      } as FormEvent<HTMLFormElement>);
    });

    expect(save).not.toHaveBeenCalled();
    expect(result.current.error).toBe("Titre obligatoire.");
  });

  it("uses the fallback error message when saving rejects with a non-error", async () => {
    const store = createStore({ title: "Valeur" });
    const save = vi.fn().mockRejectedValue("boom");
    window.sessionStorage.setItem("access_token", "token");

    const { result } = renderHook(() =>
      useSettingsManager({
        subscribe: store.subscribe,
        getSnapshot: store.getSnapshot,
        getServerSnapshot: store.getServerSnapshot,
        initialTab: "titles" as const,
        normalizeForSubmit: (form: { title: string }) => form,
        save,
        successMessage: "Saved",
        fallbackErrorMessage: "Fallback",
      }),
    );

    await act(async () => {
      await result.current.onSubmit({
        preventDefault() {},
      } as FormEvent<HTMLFormElement>);
    });

    expect(result.current.error).toBe("Fallback");
  });
});
