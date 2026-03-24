import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PromiseSettingsManager from "./PromiseSettingsManager";
import {
  DEFAULT_HEADER_SETTINGS,
  DEFAULT_HOME_HERO_SETTINGS,
  DEFAULT_PROMISE_SETTINGS,
  resetSiteSettingsStoreForTests,
} from "../../content/siteSettingsStore";

describe("PromiseSettingsManager", () => {
  beforeEach(() => {
    resetSiteSettingsStoreForTests();
    vi.restoreAllMocks();
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            header: DEFAULT_HEADER_SETTINGS,
            homeHero: DEFAULT_HOME_HERO_SETTINGS,
            promise: DEFAULT_PROMISE_SETTINGS,
          }),
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({
            header: DEFAULT_HEADER_SETTINGS,
            homeHero: DEFAULT_HOME_HERO_SETTINGS,
            promise: {
              ...DEFAULT_PROMISE_SETTINGS,
              title: "Nouveau positionnement",
            },
          }),
          text: async () => "",
        }),
    );
    window.sessionStorage.setItem("access_token", "token");
  });

  afterEach(() => {
    cleanup();
    window.sessionStorage.clear();
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
  });

  it("saves promise settings when form is valid", async () => {
    render(<PromiseSettingsManager />);

    fireEvent.change(screen.getByLabelText("Titre"), {
      target: { value: "Nouveau positionnement" },
    });
    fireEvent.change(screen.getByLabelText("Sous-titre"), {
      target: { value: "Sous-titre long de positionnement" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(screen.getByText("Positionnement mis a jour.")).toBeInTheDocument();
    });

    expect(vi.mocked(fetch)).toHaveBeenLastCalledWith(
      "/api-proxy/api/settings/admin/",
      expect.objectContaining({
        method: "PUT",
        headers: expect.objectContaining({
          Authorization: "Bearer token",
          "Content-Type": "application/json",
        }),
      }),
    );
  });

  it("filters out empty cards before saving", async () => {
    render(<PromiseSettingsManager />);
    fireEvent.click(screen.getByRole("button", { name: "Encarts" }));

    const textboxes = screen.getAllByRole("textbox");
    fireEvent.change(textboxes[0], { target: { value: "   " } });
    fireEvent.change(textboxes[1], { target: { value: "   " } });

    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(screen.getByText("Positionnement mis a jour.")).toBeInTheDocument();
    });

    expect(vi.mocked(fetch)).toHaveBeenLastCalledWith(
      "/api-proxy/api/settings/admin/",
      expect.objectContaining({
        body: expect.stringContaining("\"cards\":["),
      }),
    );
    expect(vi.mocked(fetch)).toHaveBeenLastCalledWith(
      "/api-proxy/api/settings/admin/",
      expect.objectContaining({
        body: expect.not.stringContaining("\"title\":\"\",\"content\":\"\""),
      }),
    );
  });

  it("shows an error when mandatory fields are empty", () => {
    render(<PromiseSettingsManager />);

    fireEvent.change(screen.getByLabelText("Titre"), {
      target: { value: "   " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(screen.getByText("Le titre et le sous-titre sont obligatoires.")).toBeInTheDocument();
  });

  it("shows an auth error when token lookup fails", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("session unavailable");
    });

    render(<PromiseSettingsManager />);
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(
        screen.getByText("Connexion requise pour enregistrer ces changements."),
      ).toBeInTheDocument();
    });
  });

  it("shows the fallback error when saving rejects with a non-error value", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            header: DEFAULT_HEADER_SETTINGS,
            homeHero: DEFAULT_HOME_HERO_SETTINGS,
            promise: DEFAULT_PROMISE_SETTINGS,
          }),
        })
        .mockRejectedValueOnce("boom"),
    );

    render(<PromiseSettingsManager />);
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(screen.getByText("Erreur API")).toBeInTheDocument();
    });
  });

  it("shows the API error message when saving fails with an Error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            header: DEFAULT_HEADER_SETTINGS,
            homeHero: DEFAULT_HOME_HERO_SETTINGS,
            promise: DEFAULT_PROMISE_SETTINGS,
          }),
        })
        .mockRejectedValueOnce(new Error("Sauvegarde impossible")),
    );

    render(<PromiseSettingsManager />);
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(screen.getByText("Sauvegarde impossible")).toBeInTheDocument();
    });
  });

  it("limits cards to 6", () => {
    render(<PromiseSettingsManager />);
    fireEvent.click(screen.getByRole("button", { name: "Encarts" }));

    const addButton = screen.getByRole("button", { name: "Ajouter" });
    fireEvent.click(addButton);
    fireEvent.click(addButton);

    expect(screen.getByText("Encart 6")).toBeInTheDocument();
    expect(addButton).toBeDisabled();
  });

  it("can switch between tabs", () => {
    render(<PromiseSettingsManager />);

    fireEvent.click(screen.getByRole("button", { name: "Encarts" }));
    expect(screen.getByRole("button", { name: "Ajouter" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Titres" }));
    expect(screen.getByLabelText("Sous-titre")).toBeInTheDocument();
  });

  it("can edit, reorder and remove cards", () => {
    render(<PromiseSettingsManager />);
    fireEvent.click(screen.getByRole("button", { name: "Encarts" }));

    const textboxes = screen.getAllByRole("textbox");
    fireEvent.change(textboxes[0], { target: { value: "Encart A" } });
    fireEvent.change(textboxes[1], { target: { value: "Contenu A" } });

    fireEvent.click(screen.getAllByRole("button", { name: "Descendre" })[0]);
    expect(screen.getByDisplayValue("Encart A")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "Supprimer" })[1]);
    expect(screen.queryByDisplayValue("Encart A")).not.toBeInTheDocument();
  });

  it("can move a card upward", () => {
    render(<PromiseSettingsManager />);
    fireEvent.click(screen.getByRole("button", { name: "Encarts" }));

    const textboxes = screen.getAllByRole("textbox");
    fireEvent.change(textboxes[0], { target: { value: "Premier encart" } });
    fireEvent.change(textboxes[2], { target: { value: "Second encart" } });

    fireEvent.click(screen.getAllByRole("button", { name: "Monter" })[1]);

    expect(screen.getByDisplayValue("Second encart")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Premier encart")).toBeInTheDocument();
  });
});
