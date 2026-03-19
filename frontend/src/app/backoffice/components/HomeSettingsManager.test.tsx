import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import HomeSettingsManager, { moveItem } from "./HomeSettingsManager";
import { DEFAULT_HEADER_SETTINGS, DEFAULT_HOME_HERO_SETTINGS, resetSiteSettingsStoreForTests } from "../../content/siteSettingsStore";

describe("HomeSettingsManager", () => {
  beforeEach(() => {
    resetSiteSettingsStoreForTests();
    vi.restoreAllMocks();
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            header: DEFAULT_HEADER_SETTINGS,
            homeHero: DEFAULT_HOME_HERO_SETTINGS,
          }),
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({
            header: DEFAULT_HEADER_SETTINGS,
            homeHero: {
              ...DEFAULT_HOME_HERO_SETTINGS,
              eyebrow: "Nouveau sur-titre",
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
  });

  it("saves home settings when form is valid", async () => {
    render(<HomeSettingsManager />);

    fireEvent.change(screen.getByLabelText("Sur-titre"), {
      target: { value: "Nouveau sur-titre" },
    });
    fireEvent.change(screen.getByLabelText("Titre"), {
      target: { value: "Ligne 1\nLigne 2" },
    });
    fireEvent.change(screen.getByLabelText("Sous-titre"), {
      target: { value: "Un sous-titre test" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(screen.getByText("Accueil mis a jour.")).toBeInTheDocument();
    });

    const fetchMock = vi.mocked(fetch);
    expect(fetchMock).toHaveBeenLastCalledWith(
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

  it("shows an error when mandatory fields are empty", () => {
    render(<HomeSettingsManager />);

    fireEvent.change(screen.getByLabelText("Sur-titre"), {
      target: { value: "   " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(screen.getByText("Sur-titre, titre et sous-titre sont obligatoires.")).toBeInTheDocument();
  });

  it("shows an auth error when token lookup fails", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("session unavailable");
    });

    render(<HomeSettingsManager />);
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(
        screen.getByText("Connexion requise pour enregistrer ces changements."),
      ).toBeInTheDocument();
    });
  });

  it("shows the API error message when saving fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            header: DEFAULT_HEADER_SETTINGS,
            homeHero: DEFAULT_HOME_HERO_SETTINGS,
          }),
        })
        .mockRejectedValueOnce(new Error("Sauvegarde impossible")),
    );

    render(<HomeSettingsManager />);
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(screen.getByText("Sauvegarde impossible")).toBeInTheDocument();
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
          }),
        })
        .mockRejectedValueOnce("boom"),
    );

    render(<HomeSettingsManager />);
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(screen.getByText("Impossible d'enregistrer l'accueil.")).toBeInTheDocument();
    });
  });

  it("limits cards to 4 in cards tab", () => {
    render(<HomeSettingsManager />);

    fireEvent.click(screen.getByRole("button", { name: "Encarts" }));
    const addButton = screen.getByRole("button", { name: "Ajouter" });

    fireEvent.click(addButton);
    fireEvent.click(addButton);

    expect(screen.getByText("Encart 4")).toBeInTheDocument();
    expect(addButton).toBeDisabled();
  });

  it("can edit, reorder and remove cards from the cards tab", () => {
    render(<HomeSettingsManager />);
    fireEvent.click(screen.getByRole("button", { name: "Encarts" }));

    const textboxes = screen.getAllByRole("textbox");
    fireEvent.change(textboxes[0], {
      target: { value: "Carte Alpha" },
    });
    fireEvent.change(textboxes[1], {
      target: { value: "Contenu Alpha" },
    });

    fireEvent.click(screen.getAllByRole("button", { name: "Descendre" })[0]);

    expect(screen.getByDisplayValue("Carte Alpha")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Contenu Alpha")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "Supprimer" })[1]);

    expect(screen.queryByDisplayValue("Carte Alpha")).not.toBeInTheDocument();
  });

  it("can move a card upward from the cards tab", () => {
    render(<HomeSettingsManager />);
    fireEvent.click(screen.getByRole("button", { name: "Encarts" }));

    const textboxes = screen.getAllByRole("textbox");
    fireEvent.change(textboxes[0], { target: { value: "Premiere carte" } });
    fireEvent.change(textboxes[2], { target: { value: "Seconde carte" } });

    fireEvent.click(screen.getAllByRole("button", { name: "Monter" })[1]);

    expect(screen.getByDisplayValue("Seconde carte")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Premiere carte")).toBeInTheDocument();
  });

  it("returns the same array when moveItem is a no-op or out of bounds", () => {
    const items = ["a", "b", "c"];

    expect(moveItem(items, 1, 1)).toBe(items);
    expect(moveItem(items, 1, -1)).toBe(items);
    expect(moveItem(items, 1, 3)).toBe(items);
  });

  it("shows an error when keywords become empty", () => {
    render(<HomeSettingsManager />);
    fireEvent.click(screen.getByRole("button", { name: "Liens et mots clefs" }));

    const removeButtons = () => screen.getAllByRole("button", { name: "Supprimer" });
    fireEvent.click(removeButtons()[0]);
    fireEvent.click(removeButtons()[0]);
    fireEvent.change(screen.getByDisplayValue("Ancrage"), { target: { value: "   " } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(screen.getByText("Il faut entre 1 et 5 mots-cles.")).toBeInTheDocument();
  });

  it("can reorder keywords from the links-keywords tab", () => {
    render(<HomeSettingsManager />);
    fireEvent.click(screen.getByRole("button", { name: "Liens et mots clefs" }));

    const firstKeywordCard = screen.getByText("1. mot-cle").closest("div");
    const secondKeywordCard = screen.getByText("2. mot-cle").closest("div");
    expect(firstKeywordCard).not.toBeNull();
    expect(secondKeywordCard).not.toBeNull();

    const keywordInputs = [
      within(firstKeywordCard as HTMLElement).getByRole("textbox"),
      within(secondKeywordCard as HTMLElement).getByRole("textbox"),
    ];
    fireEvent.change(keywordInputs[0], { target: { value: "Premier" } });
    fireEvent.change(keywordInputs[1], { target: { value: "Second" } });

    fireEvent.click(within(firstKeywordCard as HTMLElement).getByRole("button", { name: "Descendre" }));

    expect(screen.getByDisplayValue("Second")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Premier")).toBeInTheDocument();
  });

  it("can update and reorder links from the links-keywords tab", () => {
    render(<HomeSettingsManager />);
    fireEvent.click(screen.getByRole("button", { name: "Liens et mots clefs" }));

    const textboxes = screen.getAllByRole("textbox");
    fireEvent.change(textboxes[0], { target: { value: "Lien mis a jour" } });

    const checkbox = screen.getAllByRole("checkbox")[0];
    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();

    fireEvent.click(screen.getAllByRole("button", { name: "Descendre" })[0]);

    expect(screen.getByDisplayValue("Lien mis a jour")).toBeInTheDocument();
  });

  it("can move a link upward from the links-keywords tab", () => {
    render(<HomeSettingsManager />);
    fireEvent.click(screen.getByRole("button", { name: "Liens et mots clefs" }));

    const textboxes = screen.getAllByRole("textbox");
    fireEvent.change(textboxes[0], { target: { value: "Premier lien" } });
    fireEvent.change(textboxes[1], { target: { value: "Second lien" } });

    fireEvent.click(screen.getAllByRole("button", { name: "Monter" })[1]);

    expect(screen.getByDisplayValue("Second lien")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Premier lien")).toBeInTheDocument();
  });

  it("limits keywords to 5 and disables removing the last keyword", () => {
    render(<HomeSettingsManager />);
    fireEvent.click(screen.getByRole("button", { name: "Liens et mots clefs" }));

    const addButton = screen.getByRole("button", { name: "Ajouter" });
    fireEvent.click(addButton);
    fireEvent.click(addButton);

    expect(addButton).toBeDisabled();

    const removeButtons = screen.getAllByRole("button", { name: "Supprimer" });
    fireEvent.click(removeButtons[0]);
    fireEvent.click(screen.getAllByRole("button", { name: "Supprimer" })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: "Supprimer" })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: "Supprimer" })[0]);

    expect(screen.getByRole("button", { name: "Supprimer" })).toBeDisabled();
  });

  it("can move a keyword upward from the links-keywords tab", () => {
    render(<HomeSettingsManager />);
    fireEvent.click(screen.getByRole("button", { name: "Liens et mots clefs" }));

    const keywordInputs = screen.getAllByRole("textbox").slice(DEFAULT_HOME_HERO_SETTINGS.links.length);
    fireEvent.change(keywordInputs[0], { target: { value: "Premier mot" } });
    fireEvent.change(keywordInputs[1], { target: { value: "Second mot" } });

    fireEvent.click(screen.getAllByRole("button", { name: "Monter" })[DEFAULT_HOME_HERO_SETTINGS.links.length + 1]);

    expect(screen.getByDisplayValue("Second mot")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Premier mot")).toBeInTheDocument();
  });
});
