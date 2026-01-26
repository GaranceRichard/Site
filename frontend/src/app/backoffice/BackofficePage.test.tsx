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

  it("affiche le compteur et dÃ©sactive la suppression sans sÃ©lection", async () => {
    render(<BackofficePage />);

    await waitFor(() => {
      expect(getPageCounter()).toBeInTheDocument();
    });
    expect(normalizeText(getPageCounter().textContent)).toMatch(/Page 1 \/ 1.*1 message(?:\(s\))?/);

    const deleteBtn = screen.getByRole("button", { name: "Supprimer" });
    expect(deleteBtn).toBeDisabled();
  });

  it("active/dÃ©sactive la pagination selon les cursors", async () => {
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

  it("dÃ©clenche une recherche via le paramÃ¨tre q", async () => {
    render(<BackofficePage />);

    const search = screen.getByRole("searchbox");
    fireEvent.change(search, { target: { value: "alice" } });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    const lastCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.pop();
    expect(lastCall?.[0]).toContain("q=alice");
  });

  it("charge par dÃ©faut avec le tri date desc", async () => {
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

  it("bascule la flÃ¨che de tri sur la colonne Date", async () => {
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

  it("affiche le toast dâ€™annulation aprÃ¨s suppression", async () => {
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
});
