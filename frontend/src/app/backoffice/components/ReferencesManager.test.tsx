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

  it("ferme la modale via overlay et bouton", async () => {
    const store = setupSessionStorage();
    store.set("access_token", "token");

    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue([
        {
          id: 1,
          reference: "Ref A",
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
});
