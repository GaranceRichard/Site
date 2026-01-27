import { fireEvent, render, screen, waitFor, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import BackofficeModal from "./BackofficeModal";

describe("BackofficeModal", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.NEXT_PUBLIC_BACKOFFICE_ENABLED = "true";

    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {});
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
    cleanup();
  });

  it("renders nothing when closed", () => {
    const { container } = render(<BackofficeModal open={false} onClose={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it("shows error when API base is missing", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "";

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
        screen.getByText("Configuration manquante : NEXT_PUBLIC_API_BASE_URL.")
      ).toBeInTheDocument();
    });
  });

  it("stores tokens and calls success on successful login", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://example.test";

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

  it("affiche le message désactivé quand le backoffice est off", () => {
    process.env.NEXT_PUBLIC_BACKOFFICE_ENABLED = "false";

    render(<BackofficeModal open={true} onClose={() => {}} />);

    expect(
      screen.getByText("Le back-office est désactivé pour cet environnement.")
    ).toBeInTheDocument();
  });
});
