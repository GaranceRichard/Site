import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup } from "@testing-library/react";

import BackofficePage from "./page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

beforeEach(() => {
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

  window.sessionStorage.setItem("access_token", "token");
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: vi.fn().mockResolvedValue({
      count: 1,
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
  it("affiche le compteur et désactive la suppression sans sélection", async () => {
    render(<BackofficePage />);

    await waitFor(() => {
      expect(screen.getByText(/Page 1 — 1 message/)).toBeInTheDocument();
    });

    const deleteBtn = screen.getByRole("button", { name: "Supprimer" });
    expect(deleteBtn).toBeDisabled();
  });

  it("active/désactive la pagination selon les cursors", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({
        count: 9,
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
        next_cursor: "next",
        prev_cursor: null,
      }),
    });

    render(<BackofficePage />);

    await waitFor(() => {
      expect(screen.getByText(/Page 1 — 9 message/)).toBeInTheDocument();
    });

    const prevBtn = screen.getByRole("button", { name: "Précédent" });
    const nextBtn = screen.getByRole("button", { name: "Suivant" });

    expect(prevBtn).toBeDisabled();
    expect(nextBtn).toBeEnabled();
  });

  it("déclenche une recherche via le paramètre q", async () => {
    render(<BackofficePage />);

    const search = screen.getAllByPlaceholderText("Rechercher par nom, email ou sujet")[0];
    fireEvent.change(search, { target: { value: "alice" } });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    const lastCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.pop();
    expect(lastCall?.[0]).toContain("q=alice");
  });

  it("affiche le toast d’annulation après suppression", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({
        count: 1,
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
      expect(screen.getByText(/Page 1 — 1 message/)).toBeInTheDocument();
    });
    const checkbox = screen.getAllByRole("checkbox", { name: /Selectionner/i })[0];
    fireEvent.click(checkbox);

    const deleteBtn = screen.getByRole("button", { name: "Supprimer" });
    fireEvent.click(deleteBtn);

    expect(screen.getByText(/message\(s\) supprimé\(s\)/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Annuler" })).toBeInTheDocument();
  });

  it("annule la suppression et restaure la ligne", async () => {
    render(<BackofficePage />);

    await waitFor(() => {
      expect(screen.getByText(/Page 1 — 1 message/)).toBeInTheDocument();
    });

    const checkbox = screen.getAllByRole("checkbox", { name: /Selectionner/i })[0];
    fireEvent.click(checkbox);

    fireEvent.click(screen.getByRole("button", { name: "Supprimer" }));
    fireEvent.click(screen.getByRole("button", { name: "Annuler" }));

    expect(screen.getByText("Alice Doe")).toBeInTheDocument();
  });
});
