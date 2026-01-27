import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup } from "@testing-library/react";

import BackofficePage from "./page";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

beforeEach(() => {
  pushMock.mockClear();
  // Basic sessionStorage shim
  const store = new Map<string, string>();
  Object.defineProperty(window, "sessionStorage", {
    value: {
      getItem: (key: string) => store.get(key) || null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
    },
    configurable: true,
  });

  process.env.NEXT_PUBLIC_API_BASE_URL = "http://example.test";
  process.env.NEXT_PUBLIC_BACKOFFICE_ENABLED = "true";

  window.sessionStorage.setItem("access_token", "token");
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: vi.fn().mockResolvedValue({
      count: 1,
      page: 1,
      limit: 8,
      results: [
        {
          id: 1,
          name: "Alice Doe",
          email: "alice@example.com",
          subject: "Budget",
          message: "Hello",
          consent: true,
          source: "tests",
          created_at: new Date().toISOString(),
        },
      ],
      next_cursor: null,
      prev_cursor: null,
    }),
  });
});

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

describe("BackofficePage", () => {
  const getPageCounter = () =>
    screen.getByText((_, node) => {
      const text = node?.textContent;
      return node?.tagName === "SPAN" && Boolean(text && text.includes("Page") && text.includes("message"));
    });

  const normalizeText = (text: string | null | undefined) =>
    (text || "").replace(/\s+/g, " ").trim();

  it("affiche le compteur et désactive la suppression sans sélection", async () => {
    render(<BackofficePage />);

    await waitFor(() => {
      expect(getPageCounter()).toBeInTheDocument();
    });
    expect(normalizeText(getPageCounter().textContent)).toMatch(/Page 1 \/ 1.*1 message(?:\(s\))?/);

    const deleteBtn = screen.getByRole("button", { name: "Supprimer" });
    expect(deleteBtn).toBeDisabled();
  });

  it("active/désactive la pagination selon les cursors", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({
        count: 11,
        page: 1,
        limit: 10,
        results: [
          {
            id: 1,
            name: "Alice Doe",
            email: "alice@example.com",
            subject: "Budget",
            message: "Hello",
            consent: true,
            source: "tests",
            created_at: new Date().toISOString(),
          },
        ],
        next_cursor: "next",
        prev_cursor: null,
      }),
    });

    render(<BackofficePage />);

    await waitFor(() => {
      expect(getPageCounter()).toBeInTheDocument();
    });
    expect(normalizeText(getPageCounter().textContent)).toMatch(/Page 1 \/ 2.*11 message(?:\(s\))?/);

    const prevBtn = screen.getByRole("button", { name: "Prev" });
    const nextBtn = screen.getByRole("button", { name: "Next" });

    expect(prevBtn).toBeDisabled();
    expect(nextBtn).toBeEnabled();
  });

  it("déclenche une recherche via le paramètre q", async () => {
    render(<BackofficePage />);

    const search = screen.getByRole("searchbox");
    fireEvent.change(search, { target: { value: "alice" } });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    const lastCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.pop();
    expect(lastCall?.[0]).toContain("q=alice");
  });

  it("charge par défaut avec le tri date desc", async () => {
    render(<BackofficePage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    const lastCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.at(-1);
    expect(lastCall?.[0]).toContain("sort=created_at");
    expect(lastCall?.[0]).toContain("dir=desc");

    const dateHeader = await screen.findByRole("button", { name: "Trier par date" });
    expect(dateHeader.textContent).toContain("↓");
  });

  it("bascule la flèche de tri sur la colonne Date", async () => {
    render(<BackofficePage />);

    const dateHeader = await screen.findByRole("button", { name: "Trier par date" });
    fireEvent.click(dateHeader);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    let lastCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.pop();
    expect(lastCall?.[0]).toContain("sort=created_at");
    expect(lastCall?.[0]).toContain("dir=asc");
    expect(dateHeader.textContent).toContain("↑");

    fireEvent.click(dateHeader);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    lastCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.pop();
    expect(lastCall?.[0]).toContain("sort=created_at");
    expect(lastCall?.[0]).toContain("dir=desc");
    expect(dateHeader.textContent).toContain("↓");
  });

  it("bascule le tri asc/desc quand on clique sur un titre", async () => {
    render(<BackofficePage />);

    const header = await screen.findByRole("button", { name: "Trier par email" });
    fireEvent.click(header);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    let lastCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.pop();
    expect(lastCall?.[0]).toContain("sort=email");
    expect(lastCall?.[0]).toContain("dir=asc");

    fireEvent.click(header);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    lastCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.pop();
    expect(lastCall?.[0]).toContain("sort=email");
    expect(lastCall?.[0]).toContain("dir=desc");
  });

  it("affiche le toast d’annulation après suppression", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({
        count: 1,
        page: 1,
        limit: 8,
        results: [
          {
            id: 1,
            name: "Alice Doe",
            email: "alice@example.com",
            subject: "Budget",
            message: "Hello",
            consent: true,
            source: "tests",
            created_at: new Date().toISOString(),
          },
        ],
        next_cursor: null,
        prev_cursor: null,
      }),
    });

    render(<BackofficePage />);

    await waitFor(() => {
      expect(getPageCounter()).toBeInTheDocument();
    });
    expect(normalizeText(getPageCounter().textContent)).toMatch(/Page 1 \/ 1.*1 message(?:\(s\))?/);
    const checkbox = screen.getAllByRole("checkbox", { name: /Selectionner/i })[0];
    fireEvent.click(checkbox);

    const deleteBtn = screen.getByRole("button", { name: "Supprimer" });
    fireEvent.click(deleteBtn);

    expect(
      screen.getByText((_, node) => {
        const text = node?.textContent?.toLowerCase();
        return node?.tagName === "SPAN" && Boolean(text && text.includes("message(s) supprim"));
      })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Annuler" })).toBeInTheDocument();
  });

  it("annule la suppression et restaure la ligne", async () => {
    render(<BackofficePage />);

    await waitFor(() => {
      expect(getPageCounter()).toBeInTheDocument();
    });
    expect(normalizeText(getPageCounter().textContent)).toMatch(/Page 1 \/ 1.*1 message(?:\(s\))?/);

    const checkbox = screen.getAllByRole("checkbox", { name: /Selectionner/i })[0];
    fireEvent.click(checkbox);

    fireEvent.click(screen.getByRole("button", { name: "Supprimer" }));
    fireEvent.click(screen.getByRole("button", { name: "Annuler" }));

    expect(screen.getByText("Alice Doe")).toBeInTheDocument();
  });

  it("affiche une erreur si l'API n'est pas configurée", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "";

    render(<BackofficePage />);

    await waitFor(() => {
      expect(
        screen.getByText("Erreur : Configuration manquante : NEXT_PUBLIC_API_BASE_URL.")
      ).toBeInTheDocument();
    });
  });

  it("redirige vers l'accueil si aucun token n'est présent", async () => {
    window.sessionStorage.removeItem("access_token");

    render(<BackofficePage />);

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/");
    });
  });

  it("ouvre la modale de connexion si l'API retourne 401", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: vi.fn().mockResolvedValue("Unauthorized"),
    });

    render(<BackofficePage />);

    await waitFor(() => {
      expect(screen.getByText("Session expiree ou acces refuse. Reconnectez-vous.")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Se reconnecter" })).toBeInTheDocument();
  });

  it("affiche le loader pendant le chargement", async () => {
    let resolveFetch: (value: unknown) => void;
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve;
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockReturnValueOnce(fetchPromise as Promise<unknown>);

    render(<BackofficePage />);

    expect(screen.getByText(/Chargement/)).toBeInTheDocument();

    resolveFetch!({
      ok: true,
      json: vi.fn().mockResolvedValue({
        count: 0,
        page: 1,
        limit: 10,
        results: [],
      }),
    });

    await waitFor(() => {
      expect(screen.queryByText(/Chargement/)).toBeNull();
    });
  });

  it("ouvre le détail d'un message au clic", async () => {
    render(<BackofficePage />);

    const rowButton = await screen.findByText("Alice Doe");
    fireEvent.click(rowButton);

    expect(screen.getByTestId("message-modal")).toBeInTheDocument();
    const modal = screen.getByTestId("message-modal");
    const closeButtons = modal.querySelectorAll("button");
    closeButtons[0]?.click();
  });

  it("affiche un état vide quand aucun message n'est retourné", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({
        count: 0,
        page: 1,
        limit: 10,
        results: [],
      }),
    });

    render(<BackofficePage />);

    await waitFor(() => {
      expect(screen.getByText("Aucun message.")).toBeInTheDocument();
    });
  });

  it("affiche les ellipses quand il y a beaucoup de pages", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        count: 100,
        page: 5,
        limit: 10,
        results: [
          {
            id: 1,
            name: "Alice Doe",
            email: "alice@example.com",
            subject: "Budget",
            message: "Hello",
            consent: true,
            source: "tests",
            created_at: new Date().toISOString(),
          },
        ],
      }),
    });

    render(<BackofficePage />);

    await waitFor(() => {
      expect(screen.getAllByText("…").length).toBeGreaterThan(0);
    });
  });

  it("n'affiche pas d'ellipses quand il y a peu de pages", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({
        count: 30,
        page: 1,
        limit: 10,
        results: [
          {
            id: 1,
            name: "Alice Doe",
            email: "alice@example.com",
            subject: "Budget",
            message: "Hello",
            consent: true,
            source: "tests",
            created_at: new Date().toISOString(),
          },
        ],
      }),
    });

    render(<BackofficePage />);

    await waitFor(() => {
      expect(getPageCounter()).toBeInTheDocument();
    });

    expect(screen.queryByText("…")).toBeNull();
    expect(screen.getByRole("button", { name: "Page 2" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Page 3" })).toBeInTheDocument();
  });
  it("affiche l'écran de backoffice désactivé", async () => {
    process.env.NEXT_PUBLIC_BACKOFFICE_ENABLED = "false";

    render(<BackofficePage />);

    expect(screen.getByText("Backoffice désactivé")).toBeInTheDocument();

    process.env.NEXT_PUBLIC_BACKOFFICE_ENABLED = "true";
  });

  it("les boutons footer déclenchent les actions", async () => {
    render(<BackofficePage />);

    await waitFor(() => {
      expect(getPageCounter()).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Rafraîchir" }));
    expect(global.fetch).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Retour au site" }));
    expect(pushMock).toHaveBeenCalledWith("/");

    fireEvent.click(screen.getByRole("button", { name: "Se déconnecter" }));
    expect(pushMock).toHaveBeenCalledWith("/");
    expect(window.sessionStorage.getItem("access_token")).toBeNull();
  });

  it("demande la reconnexion si le token disparait avant suppression", async () => {
    render(<BackofficePage />);

    await waitFor(() => {
      expect(getPageCounter()).toBeInTheDocument();
    });

    const checkbox = screen.getAllByRole("checkbox", { name: /Selectionner/i })[0];
    fireEvent.click(checkbox);

    window.sessionStorage.removeItem("access_token");
    fireEvent.click(screen.getByRole("button", { name: "Supprimer" }));

    await waitFor(() => {
      expect(screen.getByText("Connexion requise pour acceder au backoffice.")).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText("Identifiant")).toBeInTheDocument();
  });

  it("restaure les elements si la suppression differee echoue", async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          count: 1,
          page: 1,
          limit: 10,
          results: [
            {
              id: 1,
              name: "Alice Doe",
              email: "alice@example.com",
              subject: "Budget",
              message: "Hello",
              consent: true,
              source: "tests",
              created_at: new Date().toISOString(),
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: vi.fn().mockResolvedValue("Server error"),
      });

    render(<BackofficePage />);

    await waitFor(() => {
      expect(screen.getByText("Alice Doe")).toBeInTheDocument();
    });

    vi.useFakeTimers();
    try {
      const checkbox = screen.getAllByRole("checkbox", { name: /Selectionner/i })[0];
      fireEvent.click(checkbox);
      fireEvent.click(screen.getByRole("button", { name: "Supprimer" }));

      await vi.advanceTimersByTimeAsync(5000);
    } finally {
      vi.useRealTimers();
    }

    await waitFor(() => {
      expect(screen.getByText(/Erreur :/i)).toBeInTheDocument();
    });
    expect(screen.getByText("Alice Doe")).toBeInTheDocument();
  });
  it("permet de se reconnecter depuis l'alerte d'auth", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: vi.fn().mockResolvedValue("Unauthorized"),
    });

    render(<BackofficePage />);

    await waitFor(() => {
      expect(screen.getByText("Session expiree ou acces refuse. Reconnectez-vous.")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Se reconnecter" }));
    expect(screen.getByPlaceholderText("Identifiant")).toBeInTheDocument();

    const closeButtons = screen.getAllByRole("button", { name: "Fermer" });
    fireEvent.click(closeButtons[0]);
  });

  it("le bouton retour accueil depuis l'alerte d'auth renvoie vers l'accueil", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: vi.fn().mockResolvedValue("Unauthorized"),
    });

    render(<BackofficePage />);

    await waitFor(() => {
      expect(screen.getByText("Session expiree ou acces refuse. Reconnectez-vous.")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Retour accueil" }));
    expect(pushMock).toHaveBeenCalledWith("/");
  });

  it("les boutons de pagination changent de page", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        count: 20,
        page: 1,
        limit: 10,
        results: [
          {
            id: 1,
            name: "Alice Doe",
            email: "alice@example.com",
            subject: "Budget",
            message: "Hello",
            consent: true,
            source: "tests",
            created_at: new Date().toISOString(),
          },
        ],
      }),
    });

    render(<BackofficePage />);

    await waitFor(() => {
      expect(getPageCounter()).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    const lastCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.at(-1);
    expect(lastCall?.[0]).toContain("page=2");
  });

  it(
    "restaure les éléments si la suppression retourne 401",
    async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          count: 1,
          page: 1,
          limit: 10,
          results: [
            {
              id: 1,
              name: "Alice Doe",
              email: "alice@example.com",
              subject: "Budget",
              message: "Hello",
              consent: true,
              source: "tests",
              created_at: new Date().toISOString(),
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: vi.fn().mockResolvedValue("Unauthorized"),
      });

    render(<BackofficePage />);

    await waitFor(() => {
      expect(getPageCounter()).toBeInTheDocument();
    });

    const checkbox = screen.getAllByRole("checkbox", { name: /Selectionner/i })[0];
    fireEvent.click(checkbox);
    fireEvent.click(screen.getByRole("button", { name: "Supprimer" }));

    await new Promise((resolve) => setTimeout(resolve, 5100));

    await waitFor(() => {
      expect(
        screen.getByText("Session expiree ou acces refuse. Reconnectez-vous.")
      ).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Se reconnecter" })).toBeInTheDocument();
    },
    10_000
  );
  it("finalise la suppression apres delai et nettoie l'undo", async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          count: 1,
          page: 1,
          limit: 10,
          results: [
            {
              id: 1,
              name: "Alice Doe",
              email: "alice@example.com",
              subject: "Budget",
              message: "Hello",
              consent: true,
              source: "tests",
              created_at: new Date().toISOString(),
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ success: true }),
      });

    render(<BackofficePage />);

    await waitFor(() => {
      expect(screen.getByText("Alice Doe")).toBeInTheDocument();
    });

    vi.useFakeTimers();
    try {
      const checkbox = screen.getAllByRole("checkbox", { name: /Selectionner/i })[0];
      fireEvent.click(checkbox);
      fireEvent.click(screen.getByRole("button", { name: "Supprimer" }));

      expect(screen.getByRole("button", { name: "Annuler" })).toBeInTheDocument();

      await vi.advanceTimersByTimeAsync(5000);
    } finally {
      vi.useRealTimers();
    }

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "Annuler" })).toBeNull();
    });

    const deleteCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.find((c) =>
      String(c[0]).includes("/api/contact/messages/admin/delete")
    );
    expect(deleteCall?.[0]).toContain("/api/contact/messages/admin/delete");
  });

  it("recharge quand on ferme la modale d'auth", async () => {
    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: vi.fn().mockResolvedValue("Unauthorized"),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          count: 1,
          page: 1,
          limit: 10,
          results: [
            {
              id: 2,
              name: "Bob Smith",
              email: "bob@example.com",
              subject: "Support",
              message: "Ping",
              consent: true,
              source: "tests",
              created_at: new Date().toISOString(),
            },
          ],
        }),
      });

    render(<BackofficePage />);

    await waitFor(() => {
      expect(screen.getByText("Session expiree ou acces refuse. Reconnectez-vous.")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Se reconnecter" }));

    // The 401 flow clears tokens; restore one before triggering the reload on close.
    window.sessionStorage.setItem("access_token", "token-restored");
    fireEvent.click(await screen.findByRole("button", { name: "Annuler" }));

    await waitFor(() => {
      expect(screen.getByText("Bob Smith")).toBeInTheDocument();
    });
    expect((global.fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("redirige depuis l'ecran desactive via le bouton retour", () => {
    process.env.NEXT_PUBLIC_BACKOFFICE_ENABLED = "false";

    render(<BackofficePage />);
    fireEvent.click(screen.getByRole("button", { name: /Retour/i }));

    expect(pushMock).toHaveBeenCalledWith("/");
    process.env.NEXT_PUBLIC_BACKOFFICE_ENABLED = "true";
  });

  it("gere un sessionStorage.getItem qui echoue pendant suppression", async () => {
    render(<BackofficePage />);

    await waitFor(() => {
      expect(screen.getByText("Alice Doe")).toBeInTheDocument();
    });

    const checkbox = screen.getAllByRole("checkbox", { name: /Selectionner/i })[0];
    fireEvent.click(checkbox);

    const originalGetItem = window.sessionStorage.getItem;
    window.sessionStorage.getItem = () => {
      throw new Error("boom");
    };

    try {
      fireEvent.click(screen.getByRole("button", { name: "Supprimer" }));

      await waitFor(() => {
        expect(screen.getByText("Connexion requise pour acceder au backoffice.")).toBeInTheDocument();
      });
      expect(screen.getByPlaceholderText("Identifiant")).toBeInTheDocument();
    } finally {
      window.sessionStorage.getItem = originalGetItem;
    }
  });

});
