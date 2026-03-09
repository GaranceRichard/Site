import { fireEvent, render, screen, waitFor, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("BackofficeModal config", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it("shows missing configuration when api base resolver returns undefined", async () => {
    vi.doMock("../lib/backoffice", async () => {
      const actual = await vi.importActual<typeof import("../lib/backoffice")>("../lib/backoffice");
      return {
        ...actual,
        resolveApiBaseUrl: () => undefined,
      };
    });

    const { default: BackofficeModal } = await import("./BackofficeModal");

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
  }, 10000);
});
