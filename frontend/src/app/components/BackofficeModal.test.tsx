import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const isBackofficeEnabledMock = vi.fn();
const resolveApiBaseUrlMock = vi.fn();

vi.mock("../lib/backoffice", () => ({
  isBackofficeEnabled: () => isBackofficeEnabledMock(),
  resolveApiBaseUrl: () => resolveApiBaseUrlMock(),
}));

import BackofficeModal from "./BackofficeModal";

describe("BackofficeModal", () => {
  beforeEach(() => {
    isBackofficeEnabledMock.mockReturnValue(true);
    resolveApiBaseUrlMock.mockReturnValue("/api-proxy");

    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    cleanup();
  });

  it("renders nothing when closed", () => {
    const { container } = render(<BackofficeModal open={false} onClose={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it("falls back to the local proxy when API base is missing", async () => {
    resolveApiBaseUrlMock.mockReturnValue("/api-proxy");
    const fetchMock = vi.fn().mockRejectedValue(new Error("boom"));
    vi.stubGlobal("fetch", fetchMock);

    render(<BackofficeModal open={true} onClose={() => {}} />);

    fireEvent.change(screen.getByPlaceholderText("Identifiant"), {
      target: { value: "user" },
    });
    fireEvent.change(screen.getByPlaceholderText("Mot de passe"), {
      target: { value: "pass" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Se connecter" }));

    await waitFor(() => {
      expect(
        screen.getByText("API introuvable (/api-proxy). Verifiez que le backend Django tourne."),
      ).toBeInTheDocument();
    });
  });

  it("shows missing configuration when api base resolver returns undefined", async () => {
    resolveApiBaseUrlMock.mockReturnValue(undefined);

    render(<BackofficeModal open={true} onClose={() => {}} />);

    fireEvent.change(screen.getByPlaceholderText("Identifiant"), {
      target: { value: "user" },
    });
    fireEvent.change(screen.getByPlaceholderText("Mot de passe"), {
      target: { value: "pass" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Se connecter" }));

    await waitFor(() => {
      expect(
        screen.getByText("Configuration manquante : NEXT_PUBLIC_API_BASE_URL."),
      ).toBeInTheDocument();
    });
  });

  it("stores tokens and calls success on successful login", async () => {
    resolveApiBaseUrlMock.mockReturnValue("http://example.test");

    const onClose = vi.fn();
    const onSuccess = vi.fn();

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ access: "token-a", refresh: "token-b" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<BackofficeModal open={true} onClose={onClose} onSuccess={onSuccess} />);

    fireEvent.change(screen.getByPlaceholderText("Identifiant"), {
      target: { value: "user" },
    });
    fireEvent.change(screen.getByPlaceholderText("Mot de passe"), {
      target: { value: "pass" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Se connecter" }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });

    expect(sessionStorage.getItem("access_token")).toBe("token-a");
    expect(sessionStorage.getItem("refresh_token")).toBe("token-b");
    expect(onClose).toHaveBeenCalled();
  });

  it("shows a validation error when credentials are missing", async () => {
    resolveApiBaseUrlMock.mockReturnValue("http://example.test");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<BackofficeModal open={true} onClose={() => {}} />);

    fireEvent.click(screen.getByRole("button", { name: "Se connecter" }));

    await waitFor(() => {
      expect(screen.getByText("Identifiant et mot de passe requis.")).toBeInTheDocument();
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows an auth error when the API rejects credentials", async () => {
    resolveApiBaseUrlMock.mockReturnValue("http://example.test");
    const fetchMock = vi.fn().mockResolvedValue({ ok: false });
    vi.stubGlobal("fetch", fetchMock);

    render(<BackofficeModal open={true} onClose={() => {}} />);

    fireEvent.change(screen.getByPlaceholderText("Identifiant"), {
      target: { value: "user" },
    });
    fireEvent.change(screen.getByPlaceholderText("Mot de passe"), {
      target: { value: "wrong-pass" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Se connecter" }));

    await waitFor(() => {
      expect(screen.getByText("Identifiant ou mot de passe invalide.")).toBeInTheDocument();
    });
  });

  it("affiche le message desactive quand le backoffice est off", () => {
    isBackofficeEnabledMock.mockReturnValue(false);

    render(<BackofficeModal open={true} onClose={() => {}} />);

    expect(screen.getByText("Le back-office est désactivé pour cet environnement.")).toBeInTheDocument();
  });

  it("closes on Escape", async () => {
    const onClose = vi.fn();
    const nativeAddEventListener = window.addEventListener.bind(window);
    let keydownHandler: ((event: KeyboardEvent) => void) | undefined;

    vi.spyOn(window, "addEventListener").mockImplementation(
      ((type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) => {
        if (type === "keydown" && typeof listener === "function") {
          keydownHandler = listener as (event: KeyboardEvent) => void;
        }
        nativeAddEventListener(type, listener, options);
      }) as typeof window.addEventListener,
    );

    render(<BackofficeModal open={true} onClose={onClose} />);

    await waitFor(() => {
      expect(keydownHandler).toBeDefined();
    });

    act(() => {
      keydownHandler?.(new KeyboardEvent("keydown", { key: "Escape", code: "Escape" }));
      keydownHandler?.(new KeyboardEvent("keydown", { key: "Enter", code: "Enter" }));
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("unmounts after the exit animation", () => {
    let closeAnimationHandler: (() => void) | undefined;
    vi.spyOn(window, "setTimeout").mockImplementation(
      ((handler: TimerHandler) => {
        if (typeof handler === "function") {
          closeAnimationHandler = handler as () => void;
        }
        return 1 as unknown as number;
      }) as typeof window.setTimeout,
    );

    const { rerender, container } = render(<BackofficeModal open={true} onClose={() => {}} />);

    rerender(<BackofficeModal open={false} onClose={() => {}} />);

    expect(closeAnimationHandler).toBeDefined();

    act(() => {
      closeAnimationHandler?.();
    });

    expect(container.firstChild).toBeNull();
  });

  it("does not submit when already sending or when disabled", async () => {
    resolveApiBaseUrlMock.mockReturnValue("http://example.test");

    let resolveFetch:
      | ((value: { ok: boolean; json: () => Promise<{ access: string; refresh: string }> }) => void)
      | null = null;
    const fetchMock = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { rerender } = render(<BackofficeModal open={true} onClose={() => {}} />);

    fireEvent.change(screen.getByPlaceholderText("Identifiant"), {
      target: { value: "user" },
    });
    fireEvent.change(screen.getByPlaceholderText("Mot de passe"), {
      target: { value: "pass" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Se connecter" }));
    fireEvent.click(screen.getByRole("button", { name: /Connexion/ }));
    fireEvent.submit(screen.getByRole("button", { name: /Connexion/ }).closest("form") as HTMLFormElement);

    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveFetch?.({
        ok: true,
        json: async () => ({ access: "token-a", refresh: "token-b" }),
      });
      await Promise.resolve();
    });

    isBackofficeEnabledMock.mockReturnValue(false);
    rerender(<BackofficeModal open={true} onClose={() => {}} />);
    fireEvent.submit(screen.getByRole("button", { name: "Se connecter" }).closest("form") as HTMLFormElement);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("ignores a second close transition while already closing", () => {
    vi.useFakeTimers();

    const { rerender } = render(<BackofficeModal open={true} onClose={() => {}} />);

    act(() => {
      rerender(<BackofficeModal open={false} onClose={() => {}} />);
    });

    act(() => {
      rerender(<BackofficeModal open={false} onClose={() => {}} />);
    });

    expect(true).toBe(true);
  });

  it("clears pending animation handles when reopening while closing", () => {
    let closeAnimationHandler: (() => void) | undefined;
    const clearTimeoutSpy = vi.spyOn(window, "clearTimeout");
    vi.spyOn(window, "setTimeout").mockImplementation(
      ((handler: TimerHandler) => {
        if (typeof handler === "function") {
          closeAnimationHandler = handler as () => void;
        }
        return 1 as unknown as number;
      }) as typeof window.setTimeout,
    );

    const { rerender } = render(<BackofficeModal open={true} onClose={() => {}} />);

    act(() => {
      rerender(<BackofficeModal open={false} onClose={() => {}} />);
    });

    expect(closeAnimationHandler).toBeDefined();

    act(() => {
      rerender(<BackofficeModal open={true} onClose={() => {}} />);
    });

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
