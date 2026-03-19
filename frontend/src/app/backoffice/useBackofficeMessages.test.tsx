import { act, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as logic from "./logic";
import { useBackofficeMessages } from "./useBackofficeMessages";
import type { Msg } from "./types";

type HarnessProps = {
  apiBase?: string;
  backofficeEnabled?: boolean;
  routerPush: (path: string) => void;
  onReady: (api: ReturnType<typeof useBackofficeMessages>) => void;
};

function HookHarness({
  apiBase,
  backofficeEnabled = true,
  routerPush,
  onReady,
}: HarnessProps) {
  const api = useBackofficeMessages({
    apiBase,
    backofficeEnabled,
    routerPush,
  });

  onReady(api);
  return null;
}

function createMessage(id: number): Msg {
  return {
    id,
    name: `Name ${id}`,
    email: `user${id}@example.test`,
    subject: `Subject ${id}`,
    message: `Message ${id}`,
    consent: true,
    source: "contact-page",
    created_at: `2026-03-0${id}T12:00:00Z`,
  };
}

function createJsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
    text: vi.fn().mockResolvedValue(typeof body === "string" ? body : JSON.stringify(body)),
  };
}

function createTextResponse(text: string, status: number) {
  return {
    ok: false,
    status,
    json: vi.fn().mockRejectedValue(new Error("no json")),
    text: vi.fn().mockResolvedValue(text),
  };
}

function renderUseBackofficeMessages(options?: {
  apiBase?: string;
  backofficeEnabled?: boolean;
}) {
  let latest: ReturnType<typeof useBackofficeMessages> | null = null;
  const routerPush = vi.fn();

  render(
    <HookHarness
      apiBase={options && "apiBase" in options ? options.apiBase : "/api-proxy"}
      backofficeEnabled={options?.backofficeEnabled}
      routerPush={routerPush}
      onReady={(value) => {
        latest = value;
      }}
    />
  );

  return {
    routerPush,
    getApi() {
      if (!latest) {
        throw new Error("Hook not ready");
      }
      return latest;
    },
  };
}

describe("useBackofficeMessages", () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it("signale une erreur si la suppression est demandee sans API base", async () => {
    const { getApi } = renderUseBackofficeMessages({ apiBase: undefined });

    await waitFor(() => {
      expect(getApi()).toBeTruthy();
    });

    await act(async () => {
      await getApi().deleteSelected();
    });

    await waitFor(() => {
      expect(getApi().errorMsg).toBe("Configuration manquante : NEXT_PUBLIC_API_BASE_URL.");
    });
  });

  it("signale une erreur si le chargement initial demarre sans API base", async () => {
    sessionStorage.setItem("access_token", "token-a");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { getApi, routerPush } = renderUseBackofficeMessages({ apiBase: undefined });

    await waitFor(() => {
      expect(getApi().status).toBe("error");
    });
    expect(getApi().errorMsg).toBe("Configuration manquante : NEXT_PUBLIC_API_BASE_URL.");
    expect(routerPush).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("redirige vers l'accueil quand le backoffice est desactive", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { routerPush } = renderUseBackofficeMessages({ backofficeEnabled: false });

    await waitFor(() => {
      expect(routerPush).toHaveBeenCalledWith("/");
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("redirige vers l'accueil quand le token est absent", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { routerPush, getApi } = renderUseBackofficeMessages();

    await waitFor(() => {
      expect(routerPush).toHaveBeenCalledWith("/");
    });
    expect(getApi().visibleItems).toEqual([]);
    expect(getApi().totalCount).toBe(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("charge les messages puis expose les actions de tri, recherche et selection", async () => {
    const firstMessage = createMessage(1);
    const secondMessage = createMessage(2);
    sessionStorage.setItem("access_token", "token-a");

    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse({
        count: 2,
        page: 1,
        limit: 10,
        results: [firstMessage, secondMessage],
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const { getApi } = renderUseBackofficeMessages();

    await waitFor(() => {
      expect(getApi().visibleItems).toHaveLength(2);
    });
    expect(getApi().status).toBe("idle");
    expect(getApi().totalCount).toBe(2);
    expect(getApi().pageSize).toBe(10);
    expect(getApi().getSortArrow("created_at")).toBe("↓");
    expect(getApi().getSortArrow("name")).toBeNull();

    act(() => {
      getApi().toggleSelected(1);
    });
    expect(getApi().selectedIds.has(1)).toBe(true);

    act(() => {
      getApi().toggleSelected(1);
    });
    expect(getApi().selectedIds.has(1)).toBe(false);

    act(() => {
      getApi().setPage(2);
      getApi().onSearchChange("garance");
    });

    await waitFor(() => {
      expect(getApi().query).toBe("garance");
    });
    expect(getApi().page).toBe(1);

    act(() => {
      getApi().changeSort("name");
    });

    await waitFor(() => {
      expect(getApi().sortField).toBe("name");
    });
    expect(getApi().sortDir).toBe("asc");
    expect(getApi().getSortArrow("name")).toBe("↑");
  });

  it("ouvre la reconnexion et vide les tokens sur erreur d'auth au chargement", async () => {
    sessionStorage.setItem("access_token", "token-a");
    sessionStorage.setItem("refresh_token", "token-b");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(createJsonResponse({}, 401)));

    const { getApi } = renderUseBackofficeMessages();

    await waitFor(() => {
      expect(getApi().openLogin).toBe(true);
    });

    expect(getApi().authMsg).toBe("Session expiree ou acces refuse. Reconnectez-vous.");
    expect(sessionStorage.getItem("access_token")).toBeNull();
    expect(sessionStorage.getItem("refresh_token")).toBeNull();
  });

  it("affiche le message d'erreur texte quand le chargement initial echoue", async () => {
    sessionStorage.setItem("access_token", "token-a");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(createTextResponse("Server exploded", 500)));

    const { getApi } = renderUseBackofficeMessages();

    await waitFor(() => {
      expect(getApi().status).toBe("error");
    });
    expect(getApi().errorMsg).toBe("Server exploded");
  });

  it("redirige vers l'accueil si sessionStorage.getItem echoue au chargement", async () => {
    const getItemSpy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("boom");
    });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { routerPush, getApi } = renderUseBackofficeMessages();

    await waitFor(() => {
      expect(routerPush).toHaveBeenCalledWith("/");
    });
    expect(getApi().status).toBe("idle");
    expect(fetchMock).not.toHaveBeenCalled();
    getItemSpy.mockRestore();
  });

  it("demande la reconnexion si aucun token n'est disponible au moment de supprimer", async () => {
    const firstMessage = createMessage(1);
    sessionStorage.setItem("access_token", "token-a");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        createJsonResponse({
          count: 1,
          page: 1,
          limit: 10,
          results: [firstMessage],
        })
      )
    );

    const { getApi } = renderUseBackofficeMessages();

    await waitFor(() => {
      expect(getApi().visibleItems).toHaveLength(1);
    });

    act(() => {
      getApi().toggleSelected(1);
    });
    sessionStorage.removeItem("access_token");

    await act(async () => {
      await getApi().deleteSelected();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(getApi().openLogin).toBe(true);
    expect(getApi().authMsg).toBe("Connexion requise pour acceder au backoffice.");
  }, 10000);

  it("ignore deleteSelected quand aucune selection n'est presente", async () => {
    const items = [createMessage(1), createMessage(2)];
    sessionStorage.setItem("access_token", "token-a");
    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse({
        count: 2,
        page: 1,
        limit: 10,
        results: items,
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const { getApi } = renderUseBackofficeMessages();

    await waitFor(() => {
      expect(getApi().visibleItems).toHaveLength(2);
    });

    await act(async () => {
      await getApi().deleteSelected();
    });

    expect(getApi().visibleItems.map((item) => item.id)).toEqual([1, 2]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("demande la reconnexion si sessionStorage.getItem echoue pendant deleteSelected", async () => {
    const firstMessage = createMessage(1);
    sessionStorage.setItem("access_token", "token-a");
    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse({
        count: 1,
        page: 1,
        limit: 10,
        results: [firstMessage],
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const { getApi } = renderUseBackofficeMessages();

    await waitFor(() => {
      expect(getApi().visibleItems).toHaveLength(1);
    });

    act(() => {
      getApi().toggleSelected(1);
    });

    const getItemSpy = vi
      .spyOn(Storage.prototype, "getItem")
      .mockImplementationOnce(() => {
        throw new Error("boom");
      });

    await act(async () => {
      await getApi().deleteSelected();
    });

    expect(getApi().openLogin).toBe(true);
    expect(getApi().authMsg).toBe("Connexion requise pour acceder au backoffice.");
    getItemSpy.mockRestore();
  });

  it("restore les messages et ouvre la reconnexion si la suppression differee retourne 401", async () => {
    const firstMessage = createMessage(1);
    const secondMessage = createMessage(2);
    sessionStorage.setItem("access_token", "token-a");
    sessionStorage.setItem("refresh_token", "token-b");

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        createJsonResponse({
          count: 2,
          page: 1,
          limit: 10,
          results: [firstMessage, secondMessage],
        })
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          count: 2,
          page: 1,
          limit: 10,
          results: [firstMessage, secondMessage],
        })
      )
      .mockResolvedValueOnce(createJsonResponse({}, 401));
    vi.stubGlobal("fetch", fetchMock);

    const { getApi } = renderUseBackofficeMessages();

    await waitFor(() => {
      expect(getApi().visibleItems).toHaveLength(2);
    });

    const setTimeoutSpy = vi.spyOn(window, "setTimeout").mockImplementation((handler: TimerHandler) => {
      queueMicrotask(() => {
        if (typeof handler === "function") {
          handler();
        }
      });
      return 1;
    });
    const clearTimeoutSpy = vi.spyOn(window, "clearTimeout").mockImplementation(() => {});

    act(() => {
      getApi().toggleSelected(1);
    });

    await act(async () => {
      await getApi().deleteSelected();
      await Promise.resolve();
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(getApi().openLogin).toBe(true);
    });
    expect(getApi().visibleItems.map((item) => item.id)).toEqual([1, 2]);
    expect(getApi().undoIds).toBeNull();
    expect(sessionStorage.getItem("access_token")).toBeNull();
    setTimeoutSpy.mockRestore();
    clearTimeoutSpy.mockRestore();
  });

  it("termine la suppression differee puis recharge la page courante quand l'API repond OK", async () => {
    const firstMessage = createMessage(1);
    const secondMessage = createMessage(2);
    sessionStorage.setItem("access_token", "token-a");

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        createJsonResponse({
          count: 2,
          page: 1,
          limit: 10,
          results: [firstMessage, secondMessage],
        })
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          count: 2,
          page: 1,
          limit: 10,
          results: [secondMessage],
        })
      )
      .mockResolvedValueOnce(createJsonResponse({ deleted: 1 }))
      .mockResolvedValueOnce(
        createJsonResponse({
          count: 1,
          page: 1,
          limit: 10,
          results: [secondMessage],
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    const { getApi } = renderUseBackofficeMessages();

    await waitFor(() => {
      expect(getApi().visibleItems).toHaveLength(2);
    });

    const setTimeoutSpy = vi.spyOn(window, "setTimeout").mockImplementation((handler: TimerHandler) => {
      queueMicrotask(() => {
        if (typeof handler === "function") {
          void handler();
        }
      });
      return 1;
    });
    const clearTimeoutSpy = vi.spyOn(window, "clearTimeout").mockImplementation(() => {});

    act(() => {
      getApi().toggleSelected(1);
    });

    await act(async () => {
      await getApi().deleteSelected();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(getApi().undoIds).toBeNull();
    });
    expect(getApi().status).toBe("idle");
    expect(getApi().visibleItems.map((item) => item.id)).toEqual([2]);
    setTimeoutSpy.mockRestore();
    clearTimeoutSpy.mockRestore();
  });

  it("affiche une erreur si loadWithExcluded echoue hors auth", async () => {
    const firstMessage = createMessage(1);
    const secondMessage = createMessage(2);
    sessionStorage.setItem("access_token", "token-a");

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        createJsonResponse({
          count: 2,
          page: 1,
          limit: 10,
          results: [firstMessage, secondMessage],
        })
      )
      .mockResolvedValueOnce(createTextResponse("Reload failed", 500));
    vi.stubGlobal("fetch", fetchMock);

    const { getApi } = renderUseBackofficeMessages();

    await waitFor(() => {
      expect(getApi().visibleItems).toHaveLength(2);
    });

    act(() => {
      getApi().toggleSelected(1);
    });

    await act(async () => {
      await getApi().deleteSelected();
      await Promise.resolve();
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(getApi().status).toBe("error");
    });
    expect(getApi().errorMsg).toBe("Reload failed");
    expect(getApi().visibleItems.map((item) => item.id)).toEqual([2]);
    expect(getApi().totalCount).toBe(1);
  }, 10000);

  it("ouvre la reconnexion si loadWithExcluded recoit une reponse auth", async () => {
    const firstMessage = createMessage(1);
    const secondMessage = createMessage(2);
    sessionStorage.setItem("access_token", "token-a");
    sessionStorage.setItem("refresh_token", "token-b");

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        createJsonResponse({
          count: 2,
          page: 1,
          limit: 10,
          results: [firstMessage, secondMessage],
        })
      )
      .mockResolvedValueOnce(createJsonResponse({}, 401));
    vi.stubGlobal("fetch", fetchMock);

    const { getApi } = renderUseBackofficeMessages();

    await waitFor(() => {
      expect(getApi().visibleItems).toHaveLength(2);
    });

    act(() => {
      getApi().toggleSelected(1);
    });
    await waitFor(() => {
      expect(getApi().selectedIds.has(1)).toBe(true);
    });

    await act(async () => {
      await getApi().deleteSelected();
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(getApi().openLogin).toBe(true);
    });
    expect(getApi().authMsg).toBe("Session expiree ou acces refuse. Reconnectez-vous.");
    expect(getApi().visibleItems).toEqual([]);
    expect(sessionStorage.getItem("access_token")).toBeNull();
    expect(sessionStorage.getItem("refresh_token")).toBeNull();
  });

  it("recompose la page avec loadWithExcluded sur plusieurs pages et s'arrete a la derniere page", async () => {
    const page1 = Array.from({ length: 10 }, (_, index) => createMessage(index + 1));
    const page2 = [createMessage(11), createMessage(12)];
    sessionStorage.setItem("access_token", "token-a");

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        createJsonResponse({
          count: 12,
          page: 1,
          limit: 10,
          results: page1,
        })
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          count: 12,
          page: 1,
          limit: 10,
          results: page1,
        })
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          count: 12,
          page: 2,
          limit: 10,
          results: page2,
        })
      );
    vi.stubGlobal("fetch", fetchMock);
    const { getApi } = renderUseBackofficeMessages();

    await waitFor(() => {
      expect(getApi().visibleItems).toHaveLength(10);
    });

    const setTimeoutSpy = vi.spyOn(window, "setTimeout").mockImplementation(() => 1);

    act(() => {
      getApi().toggleSelected(1);
      getApi().toggleSelected(2);
    });

    await act(async () => {
      await getApi().deleteSelected();
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(getApi().visibleItems.map((item) => item.id)).toEqual([3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(getApi().totalCount).toBe(10);
    setTimeoutSpy.mockRestore();
  }, 10000);

  it("ignore deleteSelected quand la selection ne correspond a aucun message", async () => {
    const items = [createMessage(1), createMessage(2)];
    sessionStorage.setItem("access_token", "token-a");

    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse({
        count: 2,
        page: 1,
        limit: 10,
        results: items,
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const { getApi } = renderUseBackofficeMessages();

    await waitFor(() => {
      expect(getApi().visibleItems).toHaveLength(2);
    });

    act(() => {
      getApi().toggleSelected(999);
    });

    await act(async () => {
      await getApi().deleteSelected();
    });

    expect(getApi().visibleItems.map((item) => item.id)).toEqual([1, 2]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  }, 10000);

  it("restore les messages et affiche une erreur si la suppression differee echoue hors auth", async () => {
    const firstMessage = createMessage(1);
    const secondMessage = createMessage(2);
    sessionStorage.setItem("access_token", "token-a");

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        createJsonResponse({
          count: 2,
          page: 1,
          limit: 10,
          results: [firstMessage, secondMessage],
        })
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          count: 2,
          page: 1,
          limit: 10,
          results: [secondMessage],
        })
      )
      .mockResolvedValueOnce(createTextResponse("Delete failed", 500));
    vi.stubGlobal("fetch", fetchMock);
    const { getApi } = renderUseBackofficeMessages();

    await waitFor(() => {
      expect(getApi().visibleItems).toHaveLength(2);
    });

    const setTimeoutSpy = vi.spyOn(window, "setTimeout").mockImplementation((handler: TimerHandler) => {
      queueMicrotask(() => {
        if (typeof handler === "function") {
          handler();
        }
      });
      return 1;
    });
    const clearTimeoutSpy = vi.spyOn(window, "clearTimeout").mockImplementation(() => {});

    act(() => {
      getApi().toggleSelected(1);
    });

    await act(async () => {
      await getApi().deleteSelected();
    });

    await waitFor(() => {
      expect(getApi().status).toBe("error");
    });
    expect(getApi().errorMsg).toBe("Delete failed");
    expect(getApi().visibleItems.map((item) => item.id)).toEqual([1, 2]);
    expect(getApi().undoIds).toBeNull();
    setTimeoutSpy.mockRestore();
    clearTimeoutSpy.mockRestore();
  }, 10000);

  it("n'ajoute rien si restoreRemoved est appele sans elements retires", async () => {
    const firstMessage = createMessage(1);
    sessionStorage.setItem("access_token", "token-a");

    const splitSelectedSpy = vi.spyOn(logic, "splitSelected").mockReturnValue({
      kept: [firstMessage],
      removed: [],
      removedIds: [1],
    });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        createJsonResponse({
          count: 1,
          page: 1,
          limit: 10,
          results: [firstMessage],
        })
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          count: 1,
          page: 1,
          limit: 10,
          results: [firstMessage],
        })
      )
      .mockResolvedValueOnce(createJsonResponse({}, 401));
    vi.stubGlobal("fetch", fetchMock);

    const { getApi } = renderUseBackofficeMessages();

    await waitFor(() => {
      expect(getApi().visibleItems).toHaveLength(1);
    });

    const setTimeoutSpy = vi.spyOn(window, "setTimeout").mockImplementation((handler: TimerHandler) => {
      queueMicrotask(() => {
        if (typeof handler === "function") {
          void handler();
        }
      });
      return 1;
    });
    const clearTimeoutSpy = vi.spyOn(window, "clearTimeout").mockImplementation(() => {});

    act(() => {
      getApi().toggleSelected(1);
    });

    await act(async () => {
      await getApi().deleteSelected();
      await Promise.resolve();
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(getApi().openLogin).toBe(true);
    });
    expect(getApi().undoIds).toBeNull();
    splitSelectedSpy.mockRestore();
    setTimeoutSpy.mockRestore();
    clearTimeoutSpy.mockRestore();
  });

  it("n'effectue rien quand undoDelete est appele sans undo en cours", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { getApi } = renderUseBackofficeMessages({ backofficeEnabled: false });

    act(() => {
      getApi().undoDelete();
    });

    expect(getApi().undoIds).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  }, 10000);

  it("annule la suppression differee puis recharge la page courante", async () => {
    const firstMessage = createMessage(1);
    const secondMessage = createMessage(2);
    sessionStorage.setItem("access_token", "token-a");

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        createJsonResponse({
          count: 2,
          page: 1,
          limit: 10,
          results: [firstMessage, secondMessage],
        })
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          count: 2,
          page: 1,
          limit: 10,
          results: [secondMessage],
        })
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          count: 2,
          page: 1,
          limit: 10,
          results: [firstMessage, secondMessage],
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    const { getApi } = renderUseBackofficeMessages();

    await waitFor(() => {
      expect(getApi().visibleItems).toHaveLength(2);
    });

    act(() => {
      getApi().toggleSelected(1);
    });

    await act(async () => {
      await getApi().deleteSelected();
      await Promise.resolve();
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(getApi().undoIds).toEqual([1]);
    });
    expect(getApi().visibleItems.map((item) => item.id)).toEqual([2]);

    act(() => {
      getApi().undoDelete();
    });

    await waitFor(() => {
      expect(getApi().undoIds).toBeNull();
    });
    expect(getApi().visibleItems.map((item) => item.id)).toEqual([1, 2]);
  }, 10000);

  it("redirige vers l'accueil si sessionStorage.getItem echoue pendant loadWithExcluded", async () => {
    const items = [createMessage(1), createMessage(2)];
    sessionStorage.setItem("access_token", "token-a");

    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse({
        count: 2,
        page: 1,
        limit: 10,
        results: items,
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const { getApi, routerPush } = renderUseBackofficeMessages();

    await waitFor(() => {
      expect(getApi().visibleItems).toHaveLength(2);
    });

    const setTimeoutSpy = vi.spyOn(window, "setTimeout").mockImplementation(() => 1);

    act(() => {
      getApi().toggleSelected(1);
    });

    const getItemSpy = vi
      .spyOn(Storage.prototype, "getItem")
      .mockImplementationOnce(() => "token-a")
      .mockImplementationOnce(() => {
        throw new Error("boom");
      });

    await act(async () => {
      await getApi().deleteSelected();
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(routerPush).toHaveBeenCalledWith("/");
    getItemSpy.mockRestore();
    setTimeoutSpy.mockRestore();
  }, 10000);

  it("ferme la modale de login puis recharge la page courante", async () => {
    sessionStorage.setItem("access_token", "token-a");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(createJsonResponse({}, 401))
      .mockResolvedValueOnce(
        createJsonResponse({
          count: 1,
          page: 1,
          limit: 10,
          results: [createMessage(3)],
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    const { getApi } = renderUseBackofficeMessages();

    await waitFor(() => {
      expect(getApi().openLogin).toBe(true);
    });

    sessionStorage.setItem("access_token", "token-c");

    await act(async () => {
      getApi().closeLoginModal();
    });

    await waitFor(() => {
      expect(getApi().openLogin).toBe(false);
    });
    await waitFor(() => {
      expect(getApi().visibleItems).toHaveLength(1);
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("recalcule la page quand elle depasse le nombre total de pages", async () => {
    sessionStorage.setItem("access_token", "token-a");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        createJsonResponse({
          count: 1,
          page: 1,
          limit: 10,
          results: [createMessage(1)],
        })
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          count: 1,
          page: 1,
          limit: 10,
          results: [createMessage(1)],
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    const { getApi } = renderUseBackofficeMessages();

    await waitFor(() => {
      expect(getApi().page).toBe(1);
    });

    act(() => {
      getApi().setPage(3);
    });

    await waitFor(() => {
      expect(getApi().page).toBe(1);
    });
  });
});
