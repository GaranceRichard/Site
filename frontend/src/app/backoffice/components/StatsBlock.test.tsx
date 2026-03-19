import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import StatsBlock from "./StatsBlock";

describe("StatsBlock", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    Object.defineProperty(window, "sessionStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => store.get(key) || null,
        setItem: (key: string, value: string) => store.set(key, value),
        removeItem: (key: string) => store.delete(key),
      },
    });
    window.sessionStorage.setItem("access_token", "token");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it("affiche un message informatif quand GA4 n'est pas configure", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ configured: false }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          ok: true,
          db: { ok: true },
          redis: { ok: true },
        }),
      }) as typeof fetch;

    render(<StatsBlock apiBase="/api-proxy" onRequestLogin={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Google Analytics non configuré.")).toBeInTheDocument();
    });

    expect(screen.getAllByText("OK").length).toBeGreaterThanOrEqual(3);
  });

  it("affiche une sante partiellement KO et permet de repoll", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          configured: true,
          cachedAt: "2026-03-19T12:00:00Z",
          data: {
            visitors30d: { total: 20, trend: [{ date: "2026-03-19", value: 20 }] },
            topCtas: [{ label: "Contact", location: "hero", clicks: 7 }],
            topReferences: [{ name: "Beneva", opens: 3 }],
            contactFormCompletion: {
              attempts: 5,
              successes: 4,
              completionRate: 80,
            },
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: vi.fn().mockResolvedValue({
          ok: false,
          db: { ok: true },
          redis: { ok: false },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          ok: true,
          db: { ok: true },
          redis: { ok: true },
        }),
      }) as typeof fetch;

    render(<StatsBlock apiBase="/api-proxy" onRequestLogin={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("20")).toBeInTheDocument();
    });
    expect(screen.getByText("80.0%")).toBeInTheDocument();
    expect(screen.getAllByText("KO").length).toBeGreaterThanOrEqual(1);

    fireEvent.click(screen.getByRole("button", { name: "Actualiser" }));

    await waitFor(() => {
      expect(screen.getAllByText("OK").length).toBeGreaterThanOrEqual(3);
    });
  });

  it("gere l'absence de configuration API et l'absence de session", async () => {
    const onRequestLogin = vi.fn();

    const { rerender } = render(<StatsBlock apiBase={undefined} onRequestLogin={onRequestLogin} />);

    await waitFor(() => {
      expect(screen.getAllByText("Configuration API manquante.").length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.getByText(/Dernier poll:/)).toBeInTheDocument();

    window.sessionStorage.removeItem("access_token");
    rerender(<StatsBlock apiBase="/api-proxy" onRequestLogin={onRequestLogin} />);

    await waitFor(() => {
      expect(screen.getByText("Session admin manquante.")).toBeInTheDocument();
    });
    expect(onRequestLogin).toHaveBeenCalled();
  });

  it("gere un sessionStorage inaccessible", async () => {
    const onRequestLogin = vi.fn();
    const originalSessionStorage = window.sessionStorage;

    Object.defineProperty(window, "sessionStorage", {
      configurable: true,
      value: {
        getItem: () => {
          throw new Error("blocked");
        },
      },
    });

    try {
      render(<StatsBlock apiBase="/api-proxy" onRequestLogin={onRequestLogin} />);

      await waitFor(() => {
        expect(screen.getByText("Session admin manquante.")).toBeInTheDocument();
      });
      expect(onRequestLogin).toHaveBeenCalled();
    } finally {
      Object.defineProperty(window, "sessionStorage", {
        configurable: true,
        value: originalSessionStorage,
      });
    }
  });

  it("gere les erreurs de resume GA4, le warning stale et les listes vides", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          configured: true,
          stale: true,
          warning: "Données mises en cache",
          cachedAt: "not-a-date",
          data: {
            visitors30d: { total: 0, trend: [] },
            topCtas: [],
            topReferences: [],
            contactFormCompletion: {
              attempts: 0,
              successes: 0,
              completionRate: 0,
            },
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          ok: true,
          db: { ok: true },
          redis: { skipped: true },
        }),
      }) as typeof fetch;

    render(<StatsBlock apiBase="/api-proxy" onRequestLogin={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Données mises en cache")).toBeInTheDocument();
    });
    expect(screen.getByText("Cache: not-a-date")).toBeInTheDocument();
    expect(screen.getByText("Pas encore de tendance exploitable.")).toBeInTheDocument();
    expect(screen.getByText("Aucun clic CTA remonté.")).toBeInTheDocument();
    expect(screen.getByText("Aucune ouverture remontée.")).toBeInTheDocument();
    expect(screen.getByText("0.0%")).toBeInTheDocument();
    expect(screen.getAllByText("OK").length).toBeGreaterThanOrEqual(3);
  });

  it("gere une erreur API stats 401 et une erreur API detaillee", async () => {
    const onRequestLogin = vi.fn();

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: vi.fn().mockResolvedValue({ detail: "Unauthorized" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          ok: true,
          db: { ok: true },
          redis: { ok: true },
        }),
      }) as typeof fetch;

    render(<StatsBlock apiBase="/api-proxy" onRequestLogin={onRequestLogin} />);

    await waitFor(() => {
      expect(screen.getByText("Session expiree ou acces refuse.")).toBeInTheDocument();
    });
    expect(onRequestLogin).toHaveBeenCalled();
  });

  it("gere une erreur API stats sans detail ni warning", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: vi.fn().mockResolvedValue({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          ok: true,
          db: { ok: true },
          redis: { ok: true },
        }),
      }) as typeof fetch;

    render(<StatsBlock apiBase="/api-proxy" onRequestLogin={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Erreur API (500)")).toBeInTheDocument();
    });
  });

  it("gere une erreur summary non-Error", async () => {
    global.fetch = vi
      .fn()
      .mockRejectedValueOnce("plain failure")
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          ok: true,
          db: { ok: true },
          redis: { ok: true },
        }),
      }) as typeof fetch;

    render(<StatsBlock apiBase="/api-proxy" onRequestLogin={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Erreur inattendue")).toBeInTheDocument();
    });
  });

  it("gere des donnees partielles de summary", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          configured: true,
          data: {},
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          ok: true,
          db: { ok: true },
          redis: { ok: true },
        }),
      }) as typeof fetch;

    render(<StatsBlock apiBase="/api-proxy" onRequestLogin={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getAllByText("0").length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.getByText("0.0%")).toBeInTheDocument();
    expect(screen.getByText("0 soumissions / 0 tentatives")).toBeInTheDocument();
  });

  it("gere les erreurs health timeout et non-Error", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          configured: true,
          data: {
            visitors30d: { total: 1, trend: [{ date: "2026-03-19", value: 1 }] },
            topCtas: [{ label: "Contact", location: "hero", clicks: 1 }],
            topReferences: [{ name: "Ref", opens: 1 }],
            contactFormCompletion: {
              attempts: 1,
              successes: 1,
              completionRate: 100,
            },
          },
        }),
      })
      .mockRejectedValueOnce(new DOMException("Aborted", "AbortError"))
      .mockRejectedValueOnce("plain failure");

    global.fetch = fetchMock as typeof fetch;

    render(<StatsBlock apiBase="/api-proxy" onRequestLogin={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getAllByText("Injoignable").length).toBeGreaterThanOrEqual(1);
    });

    fireEvent.click(screen.getByRole("button", { name: "Actualiser" }));

    await waitFor(() => {
      expect(screen.getByText("Impossible de joindre /api/health.")).toBeInTheDocument();
    });
  });
});
