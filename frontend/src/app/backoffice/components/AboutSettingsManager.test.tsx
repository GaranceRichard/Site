import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AboutSettingsManager from "./AboutSettingsManager";
import {
  DEFAULT_ABOUT_SETTINGS,
  DEFAULT_HEADER_SETTINGS,
  DEFAULT_HOME_HERO_SETTINGS,
  DEFAULT_METHOD_SETTINGS,
  DEFAULT_PROMISE_SETTINGS,
  DEFAULT_PUBLICATIONS_SETTINGS,
  resetSiteSettingsStoreForTests,
} from "../../content/siteSettingsStore";

describe("AboutSettingsManager", () => {
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
            about: DEFAULT_ABOUT_SETTINGS,
            promise: DEFAULT_PROMISE_SETTINGS,
            method: DEFAULT_METHOD_SETTINGS,
            publications: DEFAULT_PUBLICATIONS_SETTINGS,
          }),
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({
            header: DEFAULT_HEADER_SETTINGS,
            homeHero: DEFAULT_HOME_HERO_SETTINGS,
            about: {
              ...DEFAULT_ABOUT_SETTINGS,
              title: "Nouveau A propos",
            },
            promise: DEFAULT_PROMISE_SETTINGS,
            method: DEFAULT_METHOD_SETTINGS,
            publications: DEFAULT_PUBLICATIONS_SETTINGS,
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

  it("saves about settings when form is valid", async () => {
    render(<AboutSettingsManager />);

    fireEvent.change(screen.getByLabelText("Titre"), {
      target: { value: "Nouveau A propos" },
    });
    fireEvent.change(screen.getByLabelText("Sous-titre"), {
      target: { value: "Sous-titre mis a jour" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(screen.getByText("Section A propos mise a jour.")).toBeInTheDocument();
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

  it("shows an error when mandatory fields are empty", async () => {
    render(<AboutSettingsManager />);

    fireEvent.change(screen.getByLabelText("Paragraphe de presentation"), {
      target: { value: "   " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(
        screen.getByText("Le titre, le sous-titre et le paragraphe de presentation sont obligatoires."),
      ).toBeInTheDocument();
    });
  });

  it("limits encadres to 4 and filters empty ones before saving", async () => {
    render(<AboutSettingsManager />);

    const addButton = screen.getByRole("button", { name: "Ajouter" });
    expect(addButton).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Supprimer" }));
    fireEvent.change(screen.getByLabelText("Texte encadre"), {
      target: { value: "   " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(screen.getByText("Section A propos mise a jour.")).toBeInTheDocument();
    });

    expect(vi.mocked(fetch)).toHaveBeenLastCalledWith(
      "/api-proxy/api/settings/admin/",
      expect.objectContaining({
        body: expect.not.stringContaining("\"text\":\"\""),
      }),
    );
  });

  it("shows an auth error when token lookup fails or returns nothing", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementationOnce(() => {
      throw new Error("session unavailable");
    });

    render(<AboutSettingsManager />);
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(
        screen.getByText("Connexion requise pour enregistrer ces changements."),
      ).toBeInTheDocument();
    });

    cleanup();
    resetSiteSettingsStoreForTests();
    window.sessionStorage.clear();
    vi.restoreAllMocks();
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          header: DEFAULT_HEADER_SETTINGS,
          homeHero: DEFAULT_HOME_HERO_SETTINGS,
          about: DEFAULT_ABOUT_SETTINGS,
          promise: DEFAULT_PROMISE_SETTINGS,
          method: DEFAULT_METHOD_SETTINGS,
          publications: DEFAULT_PUBLICATIONS_SETTINGS,
        }),
      }),
    );

    render(<AboutSettingsManager />);
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(
        screen.getByText("Connexion requise pour enregistrer ces changements."),
      ).toBeInTheDocument();
    });
  });

  it("handles save failures, empty state, add and reorder interactions", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            header: DEFAULT_HEADER_SETTINGS,
            homeHero: DEFAULT_HOME_HERO_SETTINGS,
            about: {
              ...DEFAULT_ABOUT_SETTINGS,
              highlight: { ...DEFAULT_ABOUT_SETTINGS.highlight, items: [] },
            },
            promise: DEFAULT_PROMISE_SETTINGS,
            method: DEFAULT_METHOD_SETTINGS,
            publications: DEFAULT_PUBLICATIONS_SETTINGS,
          }),
        })
        .mockRejectedValueOnce("boom")
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            header: DEFAULT_HEADER_SETTINGS,
            homeHero: DEFAULT_HOME_HERO_SETTINGS,
            about: {
              ...DEFAULT_ABOUT_SETTINGS,
              highlight: {
                ...DEFAULT_ABOUT_SETTINGS.highlight,
                items: [
                  { id: "about-item-1", text: "Premier" },
                  { id: "about-item-2", text: "Second" },
                ],
              },
            },
            promise: DEFAULT_PROMISE_SETTINGS,
            method: DEFAULT_METHOD_SETTINGS,
            publications: DEFAULT_PUBLICATIONS_SETTINGS,
          }),
          text: async () => "",
        }),
    );
    window.sessionStorage.setItem("access_token", "token");

    render(<AboutSettingsManager />);

    await waitFor(() => {
      expect(screen.getByText("Aucun encadre pour le moment.")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Ajouter" }));
    fireEvent.change(screen.getByLabelText("Texte encadre"), {
      target: { value: "Nouveau bloc" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(screen.getByText("Erreur API")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Ajouter" }));
    fireEvent.click(screen.getByRole("button", { name: "Encadre 2" }));
    fireEvent.click(screen.getByRole("button", { name: "Monter" }));
    fireEvent.click(screen.getByRole("button", { name: "Encadre 1" }));
    fireEvent.click(screen.getByRole("button", { name: "Descendre" }));
  });

  it("shows the explicit Error message when saving rejects with an Error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            header: DEFAULT_HEADER_SETTINGS,
            homeHero: DEFAULT_HOME_HERO_SETTINGS,
            about: DEFAULT_ABOUT_SETTINGS,
            promise: DEFAULT_PROMISE_SETTINGS,
            method: DEFAULT_METHOD_SETTINGS,
            publications: DEFAULT_PUBLICATIONS_SETTINGS,
          }),
        })
        .mockRejectedValueOnce(new Error("Sauvegarde impossible")),
    );

    render(<AboutSettingsManager />);
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(screen.getByText("Sauvegarde impossible")).toBeInTheDocument();
    });
  });
});
