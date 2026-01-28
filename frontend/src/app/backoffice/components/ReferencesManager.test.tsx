import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

import ReferencesManager from "./ReferencesManager";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function setupSessionStorage() {
  const store = new Map<string, string>();
  Object.defineProperty(window, "sessionStorage", {
    value: {
      getItem: (key: string) => store.get(key) || null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
    },
    configurable: true,
  });
  return store;
}

function setupSessionStorageThrowing() {
  Object.defineProperty(window, "sessionStorage", {
    value: {
      getItem: () => {
        throw new Error("No storage");
      },
      setItem: () => {
        throw new Error("No storage");
      },
      removeItem: () => {
        throw new Error("No storage");
      },
    },
    configurable: true,
  });
}

function createDeferred<T>() {
  let resolve: (value: T) => void;
  let reject: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve: resolve!, reject: reject! };
}

describe("ReferencesManager", () => {
  it("demande la connexion si aucun token", async () => {
    setupSessionStorage();
    const onRequestLogin = vi.fn();

    render(<ReferencesManager apiBase="http://example.test" onRequestLogin={onRequestLogin} />);

    await waitFor(() => {
      expect(onRequestLogin).toHaveBeenCalled();
    });
    expect(
      screen.getByText(/Connexion requise pour accéder aux références\./)
    ).toBeInTheDocument();
  });

  it("demande la connexion si sessionStorage est indisponible", async () => {
    setupSessionStorageThrowing();
    const onRequestLogin = vi.fn();

    render(<ReferencesManager apiBase="http://example.test" onRequestLogin={onRequestLogin} />);

    await waitFor(() => {
      expect(onRequestLogin).toHaveBeenCalled();
    });
    expect(screen.getByText(/Connexion requise/)).toBeInTheDocument();
  });

  it("charge la liste et permet de créer une référence", async () => {
    const store = setupSessionStorage();
    store.set("access_token", "token");

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          id: 1,
          reference: "Ref A",
            reference_short: "",
            order_index: 1,
          image: "",
          icon: "",
          situation: "Situation A",
          tasks: [],
          actions: [],
          results: [],
        }),
      });

    vi.stubGlobal("fetch", fetchMock);

    render(<ReferencesManager apiBase="http://example.test" onRequestLogin={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Aucune référence.")).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole("button", { name: "Ajouter" })[0]);

    fireEvent.change(screen.getByLabelText("Référence"), {
      target: { value: "Ref A" },
    });
    fireEvent.change(screen.getByLabelText("Situation"), {
      target: { value: "Situation A" },
    });
    fireEvent.change(screen.getByLabelText("Tâches (1 par ligne)"), {
      target: { value: "T1" },
    });
    fireEvent.change(screen.getByLabelText("Actions (1 par ligne)"), {
      target: { value: "A1" },
    });
    fireEvent.change(screen.getByLabelText("Résultats (1 par ligne)"), {
      target: { value: "R1" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(screen.getByText("Ref A")).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://example.test/api/contact/references/admin",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("supprime plusieurs références sélectionnées", async () => {
    const store = setupSessionStorage();
    store.set("access_token", "token");

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([
          {
            id: 1,
            reference: "Ref A",
            reference_short: "",
            order_index: 1,
            image: "",
            icon: "",
            situation: "Situation A",
            tasks: [],
            actions: [],
            results: [],
          },
          {
            id: 2,
            reference: "Ref B",
            reference_short: "",
            order_index: 1,
            image: "",
            icon: "",
            situation: "Situation B",
            tasks: [],
            actions: [],
            results: [],
          },
        ]),
      })
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: true });

    vi.stubGlobal("fetch", fetchMock);

    render(<ReferencesManager apiBase="http://example.test" onRequestLogin={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Ref A")).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByLabelText("Tout sélectionner")[0]);
    fireEvent.click(screen.getByRole("button", { name: "Supprimer" }));

    await waitFor(() => {
      expect(screen.getByText("Aucune référence.")).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://example.test/api/contact/references/admin/1",
      expect.objectContaining({ method: "DELETE" }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "http://example.test/api/contact/references/admin/2",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("affiche une erreur si la suppression échoue", async () => {
    const store = setupSessionStorage();
    store.set("access_token", "token");

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([
          {
            id: 1,
            reference: "Ref A",
            reference_short: "",
            order_index: 1,
            image: "",
            icon: "",
            situation: "Situation A",
            tasks: [],
            actions: [],
            results: [],
          },
        ]),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: vi.fn().mockResolvedValue("Delete failed"),
      });

    vi.stubGlobal("fetch", fetchMock);

    render(<ReferencesManager apiBase="http://example.test" onRequestLogin={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Ref A")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText("Sélectionner Ref A"));
    fireEvent.click(screen.getByRole("button", { name: "Supprimer" }));

    await waitFor(() => {
      expect(screen.getByText(/Delete failed/)).toBeInTheDocument();
    });
  });

  it("demande la reconnexion si la suppression est lancée sans token", async () => {
    const store = setupSessionStorage();
    store.set("access_token", "token");
    const onRequestLogin = vi.fn();

    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue([
        {
          id: 1,
          reference: "Ref A",
          reference_short: "",
          order_index: 1,
          image: "",
          icon: "",
          situation: "Situation A",
          tasks: [],
          actions: [],
          results: [],
        },
      ]),
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<ReferencesManager apiBase="http://example.test" onRequestLogin={onRequestLogin} />);

    await waitFor(() => {
      expect(screen.getByText("Ref A")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText("Sélectionner Ref A"));
    store.delete("access_token");

    fireEvent.click(screen.getByRole("button", { name: "Supprimer" }));

    await waitFor(() => {
      expect(onRequestLogin).toHaveBeenCalled();
    });
    expect(screen.getByText(/Connexion requise/)).toBeInTheDocument();
  });

  it("demande la reconnexion si la suppression retourne 401", async () => {
    const store = setupSessionStorage();
    store.set("access_token", "token");
    const onRequestLogin = vi.fn();

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([
          {
            id: 1,
            reference: "Ref A",
            reference_short: "",
            order_index: 1,
            image: "",
            icon: "",
            situation: "Situation A",
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
      });

    vi.stubGlobal("fetch", fetchMock);

    render(<ReferencesManager apiBase="http://example.test" onRequestLogin={onRequestLogin} />);

    await waitFor(() => {
      expect(screen.getByText("Ref A")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText("Sélectionner Ref A"));
    fireEvent.click(screen.getByRole("button", { name: "Supprimer" }));

    await waitFor(() => {
      expect(onRequestLogin).toHaveBeenCalled();
    });
    expect(screen.getByText(/Connexion requise/)).toBeInTheDocument();
  });

  it("ouvre une référence et permet l'upload de l’icône", async () => {
    const store = setupSessionStorage();
    store.set("access_token", "token");

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([
          {
            id: 1,
            reference: "Ref A",
            reference_short: "",
            order_index: 1,
            image: "",
            icon: "",
            situation: "Situation A",
            tasks: [],
            actions: [],
            results: [],
          },
        ]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          url: "http://example.test/media/references/icon.webp",
        }),
      });

    vi.stubGlobal("fetch", fetchMock);

    render(<ReferencesManager apiBase="http://example.test" onRequestLogin={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Ref A")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Ref A"));
    fireEvent.click(screen.getByRole("button", { name: "Charger l’icône" }));

    const inputs = document.querySelectorAll("input[type='file']");
    const file = new File(["icon"], "icon.png", { type: "image/png" });
    fireEvent.change(inputs[1], { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText("http://example.test/media/references/icon.webp")).toBeInTheDocument();
    });
  });

  it("bascule la sélection globale et une ligne", async () => {
    const store = setupSessionStorage();
    store.set("access_token", "token");

    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue([
        {
          id: 1,
          reference: "Ref A",
            reference_short: "",
            order_index: 1,
          image: "",
          icon: "",
          situation: "Situation A",
          tasks: [],
          actions: [],
          results: [],
        },
      ]),
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<ReferencesManager apiBase="http://example.test" onRequestLogin={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Ref A")).toBeInTheDocument();
    });

    const selectAll = screen.getAllByLabelText("Tout sélectionner")[0];
    fireEvent.click(selectAll);
    fireEvent.click(selectAll);

    const rowCheckbox = screen.getByLabelText("Sélectionner Ref A");
    fireEvent.click(rowCheckbox);
    fireEvent.click(rowCheckbox);
  });

  it("permet l'upload d'une image via le bouton", async () => {
    const store = setupSessionStorage();
    store.set("access_token", "token");

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          url: "http://example.test/media/references/ref.webp",
        }),
      });

    vi.stubGlobal("fetch", fetchMock);

    render(<ReferencesManager apiBase="http://example.test" onRequestLogin={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Aucune référence.")).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole("button", { name: "Ajouter" })[0]);

    fireEvent.click(screen.getByRole("button", { name: "Charger l’image" }));

    const inputs = document.querySelectorAll("input[type='file']");
    const file = new File(["img"], "image.png", { type: "image/png" });
    fireEvent.change(inputs[0], { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText("http://example.test/media/references/ref.webp")).toBeInTheDocument();
    });
  });

  it("affiche une erreur si l'upload est lancé sans apiBase", async () => {
    setupSessionStorage();

    render(<ReferencesManager apiBase={undefined} onRequestLogin={vi.fn()} />);

    await waitFor(() => {
      expect(
        screen.getByText(/Configuration manquante : NEXT_PUBLIC_API_BASE_URL\./)
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole("button", { name: "Ajouter" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Charger l’image" }));

    const inputs = document.querySelectorAll("input[type='file']");
    const file = new File(["img"], "image.png", { type: "image/png" });
    fireEvent.change(inputs[0], { target: { files: [file] } });

    await waitFor(() => {
      expect(
        screen.getByText(/Configuration manquante : NEXT_PUBLIC_API_BASE_URL\./)
      ).toBeInTheDocument();
    });
  });

  it("demande la reconnexion si l'upload est lancé sans token", async () => {
    const store = setupSessionStorage();
    store.set("access_token", "token");
    const onRequestLogin = vi.fn();

    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue([]),
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<ReferencesManager apiBase="http://example.test" onRequestLogin={onRequestLogin} />);

    await waitFor(() => {
      expect(screen.getByText("Aucune référence.")).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole("button", { name: "Ajouter" })[0]);
    store.delete("access_token");

    fireEvent.click(screen.getByRole("button", { name: "Charger l’image" }));
    const inputs = document.querySelectorAll("input[type='file']");
    const file = new File(["img"], "image.png", { type: "image/png" });
    fireEvent.change(inputs[0], { target: { files: [file] } });

    await waitFor(() => {
      expect(onRequestLogin).toHaveBeenCalled();
    });
    expect(screen.getByText(/Connexion requise/)).toBeInTheDocument();
  });

  it("affiche une erreur si l'upload retourne une erreur serveur", async () => {
    const store = setupSessionStorage();
    store.set("access_token", "token");

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([]),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: vi.fn().mockResolvedValue("Server error"),
      });

    vi.stubGlobal("fetch", fetchMock);

    render(<ReferencesManager apiBase="http://example.test" onRequestLogin={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Aucune référence.")).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole("button", { name: "Ajouter" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Charger l’image" }));

    const inputs = document.querySelectorAll("input[type='file']");
    const file = new File(["img"], "image.png", { type: "image/png" });
    fireEvent.change(inputs[0], { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/Server error/)).toBeInTheDocument();
    });
  });

  it("affiche une erreur si la création retourne une erreur serveur", async () => {
    const store = setupSessionStorage();
    store.set("access_token", "token");

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([]),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: vi.fn().mockResolvedValue("Create failed"),
      });

    vi.stubGlobal("fetch", fetchMock);

    render(<ReferencesManager apiBase="http://example.test" onRequestLogin={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Aucune référence.")).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole("button", { name: "Ajouter" })[0]);

    fireEvent.change(screen.getByLabelText("Référence"), {
      target: { value: "Ref A" },
    });
    fireEvent.change(screen.getByLabelText("Situation"), {
      target: { value: "Situation A" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(screen.getByText(/Create failed/)).toBeInTheDocument();
    });
  });

  it("affiche une erreur si la création est lancée sans apiBase", async () => {
    setupSessionStorage();

    render(<ReferencesManager apiBase={undefined} onRequestLogin={vi.fn()} />);

    await waitFor(() => {
      expect(
        screen.getByText(/Configuration manquante : NEXT_PUBLIC_API_BASE_URL\./)
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole("button", { name: "Ajouter" })[0]);

    fireEvent.change(screen.getByLabelText("Référence"), {
      target: { value: "Ref A" },
    });
    fireEvent.change(screen.getByLabelText("Situation"), {
      target: { value: "Situation A" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(
        screen.getByText(/Configuration manquante : NEXT_PUBLIC_API_BASE_URL\./)
      ).toBeInTheDocument();
    });
  });

  it("demande la reconnexion si la création est lancée sans token", async () => {
    const store = setupSessionStorage();
    store.set("access_token", "token");
    const onRequestLogin = vi.fn();

    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue([]),
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<ReferencesManager apiBase="http://example.test" onRequestLogin={onRequestLogin} />);

    await waitFor(() => {
      expect(screen.getByText("Aucune référence.")).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole("button", { name: "Ajouter" })[0]);
    store.delete("access_token");

    fireEvent.change(screen.getByLabelText("Référence"), {
      target: { value: "Ref A" },
    });
    fireEvent.change(screen.getByLabelText("Situation"), {
      target: { value: "Situation A" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(onRequestLogin).toHaveBeenCalled();
    });
    expect(screen.getByText(/Connexion requise/)).toBeInTheDocument();
  });

  it("permet de déplacer une référence vers le bas", async () => {
    const store = setupSessionStorage();
    store.set("access_token", "token");

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([
          {
            id: 1,
            reference: "Ref A",
            reference_short: "",
            order_index: 1,
            image: "",
            icon: "",
            situation: "Situation A",
            tasks: [],
            actions: [],
            results: [],
          },
          {
            id: 2,
            reference: "Ref B",
            reference_short: "",
            order_index: 2,
            image: "",
            icon: "",
            situation: "Situation B",
            tasks: [],
            actions: [],
            results: [],
          },
        ]),
      })
      .mockResolvedValueOnce({ ok: true, status: 200, json: vi.fn() })
      .mockResolvedValueOnce({ ok: true, status: 200, json: vi.fn() });

    vi.stubGlobal("fetch", fetchMock);

    render(<ReferencesManager apiBase="http://example.test" onRequestLogin={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Ref A")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Descendre Ref A" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "http://example.test/api/contact/references/admin/1",
        expect.objectContaining({ method: "PATCH" }),
      );
      expect(fetchMock).toHaveBeenCalledWith(
        "http://example.test/api/contact/references/admin/2",
        expect.objectContaining({ method: "PATCH" }),
      );
    });
  });

  it("permet de déplacer une référence vers le haut", async () => {
    const store = setupSessionStorage();
    store.set("access_token", "token");

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([
          {
            id: 1,
            reference: "Ref A",
            reference_short: "",
            order_index: 1,
            image: "",
            icon: "",
            situation: "Situation A",
            tasks: [],
            actions: [],
            results: [],
          },
          {
            id: 2,
            reference: "Ref B",
            reference_short: "",
            order_index: 2,
            image: "",
            icon: "",
            situation: "Situation B",
            tasks: [],
            actions: [],
            results: [],
          },
        ]),
      })
      .mockResolvedValueOnce({ ok: true, status: 200, json: vi.fn() })
      .mockResolvedValueOnce({ ok: true, status: 200, json: vi.fn() });

    vi.stubGlobal("fetch", fetchMock);

    render(<ReferencesManager apiBase="http://example.test" onRequestLogin={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Ref B")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Monter Ref B" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "http://example.test/api/contact/references/admin/2",
        expect.objectContaining({ method: "PATCH" }),
      );
      expect(fetchMock).toHaveBeenCalledWith(
        "http://example.test/api/contact/references/admin/1",
        expect.objectContaining({ method: "PATCH" }),
      );
    });
  });

  it("affiche une erreur si le déplacement échoue", async () => {
    const store = setupSessionStorage();
    store.set("access_token", "token");

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([
          {
            id: 1,
            reference: "Ref A",
            reference_short: "",
            order_index: 1,
            image: "",
            icon: "",
            situation: "Situation A",
            tasks: [],
            actions: [],
            results: [],
          },
          {
            id: 2,
            reference: "Ref B",
            reference_short: "",
            order_index: 2,
            image: "",
            icon: "",
            situation: "Situation B",
            tasks: [],
            actions: [],
            results: [],
          },
        ]),
      })
      .mockResolvedValueOnce({ ok: true, status: 200, json: vi.fn() })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: vi.fn().mockResolvedValue("Move failed"),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([]),
      });

    vi.stubGlobal("fetch", fetchMock);

    render(<ReferencesManager apiBase="http://example.test" onRequestLogin={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Ref A")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Descendre Ref A" }));

    await waitFor(() => {
      const listCalls = fetchMock.mock.calls.filter(
        (call) => call[0] === "http://example.test/api/contact/references/admin",
      );
      expect(listCalls.length).toBeGreaterThan(1);
    });
  });

  it("affiche une erreur si le déplacement échoue dès la première requête", async () => {
    const store = setupSessionStorage();
    store.set("access_token", "token");

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([
          {
            id: 1,
            reference: "Ref A",
            reference_short: "",
            order_index: 1,
            image: "",
            icon: "",
            situation: "Situation A",
            tasks: [],
            actions: [],
            results: [],
          },
          {
            id: 2,
            reference: "Ref B",
            reference_short: "",
            order_index: 2,
            image: "",
            icon: "",
            situation: "Situation B",
            tasks: [],
            actions: [],
            results: [],
          },
        ]),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: vi.fn().mockResolvedValue("Swap failed"),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([]),
      });

    vi.stubGlobal("fetch", fetchMock);

    render(<ReferencesManager apiBase="http://example.test" onRequestLogin={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Ref A")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Descendre Ref A" }));

    await waitFor(() => {
      const listCalls = fetchMock.mock.calls.filter(
        (call) => call[0] === "http://example.test/api/contact/references/admin",
      );
      expect(listCalls.length).toBeGreaterThan(1);
    });
  });

  it("demande la reconnexion si la deuxième requête de déplacement retourne 401", async () => {
    const store = setupSessionStorage();
    store.set("access_token", "token");
    const onRequestLogin = vi.fn();

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([
          {
            id: 1,
            reference: "Ref A",
            reference_short: "",
            order_index: 1,
            image: "",
            icon: "",
            situation: "Situation A",
            tasks: [],
            actions: [],
            results: [],
          },
          {
            id: 2,
            reference: "Ref B",
            reference_short: "",
            order_index: 2,
            image: "",
            icon: "",
            situation: "Situation B",
            tasks: [],
            actions: [],
            results: [],
          },
        ]),
      })
      .mockResolvedValueOnce({ ok: true, status: 200, json: vi.fn() })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: vi.fn().mockResolvedValue("Unauthorized"),
      });

    vi.stubGlobal("fetch", fetchMock);

    render(<ReferencesManager apiBase="http://example.test" onRequestLogin={onRequestLogin} />);

    await waitFor(() => {
      expect(screen.getByText("Ref A")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Descendre Ref A" }));

    await waitFor(() => {
      expect(onRequestLogin).toHaveBeenCalled();
    });
  });

  it("demande la reconnexion si le déplacement est lancé sans token", async () => {
    const store = setupSessionStorage();
    store.set("access_token", "token");
    const onRequestLogin = vi.fn();

    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue([
        {
          id: 1,
          reference: "Ref A",
          reference_short: "",
          order_index: 1,
          image: "",
          icon: "",
          situation: "Situation A",
          tasks: [],
          actions: [],
          results: [],
        },
        {
          id: 2,
          reference: "Ref B",
          reference_short: "",
          order_index: 2,
          image: "",
          icon: "",
          situation: "Situation B",
          tasks: [],
          actions: [],
          results: [],
        },
      ]),
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<ReferencesManager apiBase="http://example.test" onRequestLogin={onRequestLogin} />);

    await waitFor(() => {
      expect(screen.getByText("Ref A")).toBeInTheDocument();
    });

    store.delete("access_token");
    fireEvent.click(screen.getByRole("button", { name: "Descendre Ref A" }));

    await waitFor(() => {
      expect(onRequestLogin).toHaveBeenCalled();
    });
  });

  it("affiche une erreur si le déplacement est lancé sans apiBase", async () => {
    const store = setupSessionStorage();
    store.set("access_token", "token");

    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue([
        {
          id: 1,
          reference: "Ref A",
          reference_short: "",
          order_index: 1,
          image: "",
          icon: "",
          situation: "Situation A",
          tasks: [],
          actions: [],
          results: [],
        },
        {
          id: 2,
          reference: "Ref B",
          reference_short: "",
          order_index: 2,
          image: "",
          icon: "",
          situation: "Situation B",
          tasks: [],
          actions: [],
          results: [],
        },
      ]),
    });

    vi.stubGlobal("fetch", fetchMock);

    const { rerender } = render(
      <ReferencesManager apiBase="http://example.test" onRequestLogin={vi.fn()} />
    );

    await waitFor(() => {
      expect(screen.getByText("Ref A")).toBeInTheDocument();
    });

    rerender(<ReferencesManager apiBase={undefined} onRequestLogin={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Descendre Ref A" }));

    await waitFor(() => {
      expect(
        screen.getByText(/Configuration manquante : NEXT_PUBLIC_API_BASE_URL\./)
      ).toBeInTheDocument();
    });
  });

  it("déclenche le stopPropagation sur la colonne Ordre", async () => {
    const store = setupSessionStorage();
    store.set("access_token", "token");

    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue([
        {
          id: 1,
          reference: "Ref A",
          reference_short: "",
          order_index: 1,
          image: "",
          icon: "",
          situation: "Situation A",
          tasks: [],
          actions: [],
          results: [],
        },
      ]),
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<ReferencesManager apiBase="http://example.test" onRequestLogin={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Ref A")).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByText("1")[0]);
  });

  it("demande la reconnexion si la première requête de déplacement retourne 401", async () => {
    const store = setupSessionStorage();
    store.set("access_token", "token");
    const onRequestLogin = vi.fn();

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([
          {
            id: 1,
            reference: "Ref A",
            reference_short: "",
            order_index: 1,
            image: "",
            icon: "",
            situation: "Situation A",
            tasks: [],
            actions: [],
            results: [],
          },
          {
            id: 2,
            reference: "Ref B",
            reference_short: "",
            order_index: 2,
            image: "",
            icon: "",
            situation: "Situation B",
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
      });

    vi.stubGlobal("fetch", fetchMock);

    render(<ReferencesManager apiBase="http://example.test" onRequestLogin={onRequestLogin} />);

    await waitFor(() => {
      expect(screen.getByText("Ref A")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Descendre Ref A" }));

    await waitFor(() => {
      expect(onRequestLogin).toHaveBeenCalled();
    });
  });

  it("ferme la modale via overlay et bouton", async () => {
    const store = setupSessionStorage();
    store.set("access_token", "token");

    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue([
        {
          id: 1,
          reference: "Ref A",
            reference_short: "",
            order_index: 1,
          image: "",
          icon: "",
          situation: "Situation A",
          tasks: [],
          actions: [],
          results: [],
        },
      ]),
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<ReferencesManager apiBase="http://example.test" onRequestLogin={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Ref A")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Ref A"));
    fireEvent.click(screen.getByLabelText("Fermer"));

    fireEvent.click(screen.getByText("Ref A"));
    fireEvent.click(screen.getByText("Fermer").closest("button") as HTMLButtonElement);
  });

  it("affiche une erreur si l'API base manque", async () => {
    setupSessionStorage();

    render(<ReferencesManager apiBase={undefined} onRequestLogin={vi.fn()} />);

    await waitFor(() => {
      expect(
        screen.getByText(/Configuration manquante : NEXT_PUBLIC_API_BASE_URL\./)
      ).toBeInTheDocument();
    });
  });

  it("affiche une erreur si le chargement échoue", async () => {
    const store = setupSessionStorage();
    store.set("access_token", "token");

    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: vi.fn().mockResolvedValue("Load failed"),
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<ReferencesManager apiBase="http://example.test" onRequestLogin={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/Load failed/)).toBeInTheDocument();
    });
  });

  it("demande la reconnexion si le chargement retourne 401", async () => {
    const store = setupSessionStorage();
    store.set("access_token", "token");
    const onRequestLogin = vi.fn();

    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: vi.fn().mockResolvedValue("Unauthorized"),
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<ReferencesManager apiBase="http://example.test" onRequestLogin={onRequestLogin} />);

    await waitFor(() => {
      expect(onRequestLogin).toHaveBeenCalled();
    });
  });

  it("montre l'état de chargement et masque l'état vide pendant le fetch", async () => {
    const store = setupSessionStorage();
    store.set("access_token", "token");

    const deferred = createDeferred<Response>();
    const fetchMock = vi.fn().mockReturnValueOnce(deferred.promise);
    vi.stubGlobal("fetch", fetchMock);

    render(<ReferencesManager apiBase="http://example.test" onRequestLogin={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Chargement…")).toBeInTheDocument();
    });
    expect(screen.queryByText("Aucune référence.")).not.toBeInTheDocument();

    deferred.resolve({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue([]),
    } as unknown as Response);

    await waitFor(() => {
      expect(screen.getByText("Aucune référence.")).toBeInTheDocument();
    });
  });

  it("affiche une erreur si la référence ou la situation manque", async () => {
    const store = setupSessionStorage();
    store.set("access_token", "token");

    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue([]),
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<ReferencesManager apiBase="http://example.test" onRequestLogin={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Aucune référence.")).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole("button", { name: "Ajouter" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(screen.getByText(/Référence et situation sont obligatoires\./)).toBeInTheDocument();
    });
  });

  it("affiche l'indicateur d'upload et gère l'absence d'url", async () => {
    const store = setupSessionStorage();
    store.set("access_token", "token");

    const deferred = createDeferred<Response>();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([]),
      })
      .mockReturnValueOnce(deferred.promise);

    vi.stubGlobal("fetch", fetchMock);

    render(<ReferencesManager apiBase="http://example.test" onRequestLogin={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Aucune référence.")).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole("button", { name: "Ajouter" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Charger l’image" }));

    const inputs = document.querySelectorAll("input[type='file']");
    const file = new File(["img"], "image.png", { type: "image/png" });
    fireEvent.change(inputs[0], { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText("Upload…")).toBeInTheDocument();
    });

    deferred.resolve({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({}),
    } as unknown as Response);

    await waitFor(() => {
      expect(screen.getByText(/URL d'image manquante\./)).toBeInTheDocument();
    });
  });

  it("ne déclenche pas l'upload si aucun fichier n'est sélectionné", async () => {
    const store = setupSessionStorage();
    store.set("access_token", "token");

    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue([]),
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<ReferencesManager apiBase="http://example.test" onRequestLogin={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Aucune référence.")).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole("button", { name: "Ajouter" })[0]);

    const inputs = document.querySelectorAll("input[type='file']");
    fireEvent.change(inputs[0], { target: { files: [] } });
    fireEvent.change(inputs[1], { target: { files: [] } });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("affiche une erreur si l'upload échoue avec une exception", async () => {
    const store = setupSessionStorage();
    store.set("access_token", "token");

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([]),
      })
      .mockRejectedValueOnce(new Error("Network error"));

    vi.stubGlobal("fetch", fetchMock);

    render(<ReferencesManager apiBase="http://example.test" onRequestLogin={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Aucune référence.")).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole("button", { name: "Ajouter" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Charger l’image" }));

    const inputs = document.querySelectorAll("input[type='file']");
    const file = new File(["img"], "image.png", { type: "image/png" });
    fireEvent.change(inputs[0], { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeInTheDocument();
    });
  });

  it("met à jour une référence existante", async () => {
    const store = setupSessionStorage();
    store.set("access_token", "token");

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([
          {
            id: 1,
            reference: "Ref A",
            reference_short: "",
            order_index: 1,
            image: "",
            icon: "",
            situation: "Situation A",
            tasks: [],
            actions: [],
            results: [],
          },
        ]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          id: 1,
          reference: "Ref A+",
            reference_short: "",
            order_index: 1,
          image: "",
          icon: "",
          situation: "Situation A",
          tasks: [],
          actions: [],
          results: [],
        }),
      });

    vi.stubGlobal("fetch", fetchMock);

    render(<ReferencesManager apiBase="http://example.test" onRequestLogin={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Ref A")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Ref A"));
    expect(screen.getByText("Modifier la référence")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Référence"), {
      target: { value: "Ref A+" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(screen.getByText("Ref A+")).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://example.test/api/contact/references/admin/1",
      expect.objectContaining({ method: "PUT" }),
    );
  });

  it("ferme la modale si la référence en édition est supprimée", async () => {
    const store = setupSessionStorage();
    store.set("access_token", "token");

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([
          {
            id: 1,
            reference: "Ref A",
            reference_short: "",
            order_index: 1,
            image: "",
            icon: "",
            situation: "Situation A",
            tasks: [],
            actions: [],
            results: [],
          },
        ]),
      })
      .mockResolvedValueOnce({ ok: true });

    vi.stubGlobal("fetch", fetchMock);

    render(<ReferencesManager apiBase="http://example.test" onRequestLogin={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Ref A")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Ref A"));
    fireEvent.click(screen.getByLabelText("Sélectionner Ref A"));
    fireEvent.click(screen.getByRole("button", { name: "Supprimer" }));

    await waitFor(() => {
      expect(screen.getByText("Aucune référence.")).toBeInTheDocument();
    });
    expect(screen.queryByText("Modifier la référence")).not.toBeInTheDocument();
  });

  it("demande la reconnexion si l'upload retourne 401", async () => {
    const store = setupSessionStorage();
    store.set("access_token", "token");
    const onRequestLogin = vi.fn();

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([]),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: vi.fn().mockResolvedValue("Unauthorized"),
      });

    vi.stubGlobal("fetch", fetchMock);

    render(<ReferencesManager apiBase="http://example.test" onRequestLogin={onRequestLogin} />);

    await waitFor(() => {
      expect(screen.getByText("Aucune référence.")).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole("button", { name: "Ajouter" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Charger l’image" }));

    const inputs = document.querySelectorAll("input[type='file']");
    const file = new File(["img"], "image.png", { type: "image/png" });
    fireEvent.change(inputs[0], { target: { files: [file] } });

    await waitFor(() => {
      expect(onRequestLogin).toHaveBeenCalled();
    });
    expect(screen.getByText(/Connexion requise/)).toBeInTheDocument();
  });

  it("garde la modale ouverte si la création retourne 401", async () => {
    const store = setupSessionStorage();
    store.set("access_token", "token");
    const onRequestLogin = vi.fn();

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([]),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: vi.fn().mockResolvedValue("Unauthorized"),
      });

    vi.stubGlobal("fetch", fetchMock);

    render(<ReferencesManager apiBase="http://example.test" onRequestLogin={onRequestLogin} />);

    await waitFor(() => {
      expect(screen.getByText("Aucune référence.")).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole("button", { name: "Ajouter" })[0]);

    fireEvent.change(screen.getByLabelText("Référence"), {
      target: { value: "Ref A" },
    });
    fireEvent.change(screen.getByLabelText("Titre court"), {
      target: { value: "Ref" },
    });
    fireEvent.change(screen.getByLabelText("Situation"), {
      target: { value: "Situation A" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(onRequestLogin).toHaveBeenCalled();
    });
    expect(screen.getByText("Créer une référence")).toBeInTheDocument();
    expect(screen.getByText(/Connexion requise/)).toBeInTheDocument();
  });
});
