import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import HomeSettingsManager, { moveItem } from "./HomeSettingsManager";

const HOME_HERO_SETTINGS_KEY = "site_home_hero_settings";

describe("HomeSettingsManager", () => {
  beforeEach(() => {
    window.localStorage.removeItem(HOME_HERO_SETTINGS_KEY);
  });

  afterEach(() => {
    cleanup();
  });

  it("saves home settings when form is valid", () => {
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

    expect(screen.getByText("Accueil mis a jour.")).toBeInTheDocument();
    expect(window.localStorage.getItem(HOME_HERO_SETTINGS_KEY)).toContain("Nouveau sur-titre");
  });

  it("shows an error when mandatory fields are empty", () => {
    render(<HomeSettingsManager />);

    fireEvent.change(screen.getByLabelText("Sur-titre"), {
      target: { value: "   " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(screen.getByText("Sur-titre, titre et sous-titre sont obligatoires.")).toBeInTheDocument();
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

  it("returns the same array when moveItem is a no-op or out of bounds", () => {
    const items = ["a", "b", "c"];

    expect(moveItem(items, 1, 1)).toBe(items);
    expect(moveItem(items, 1, -1)).toBe(items);
    expect(moveItem(items, 1, 3)).toBe(items);
  });

  it("can reorder links and keeps the new order on save", () => {
    render(<HomeSettingsManager />);
    fireEvent.click(screen.getByRole("button", { name: "Liens et mots clefs" }));

    const firstMoveDown = screen.getAllByRole("button", { name: "Descendre" })[0];
    fireEvent.click(firstMoveDown);
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    const saved = JSON.parse(window.localStorage.getItem(HOME_HERO_SETTINGS_KEY) || "{}");
    expect(saved.links?.[0]?.id).toBe("references");
    expect(saved.links?.[1]?.id).toBe("services");
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

    const movedKeywordInput = screen.getByDisplayValue("Premier");
    const movedKeywordCard = movedKeywordInput.closest("div");
    expect(movedKeywordCard).not.toBeNull();
    fireEvent.click(within(movedKeywordCard as HTMLElement).getByRole("button", { name: "Monter" }));

    expect(screen.getByDisplayValue("Premier")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Second")).toBeInTheDocument();
  });

  it("covers main tab interactions and actions handlers", () => {
    render(<HomeSettingsManager />);

    fireEvent.change(screen.getByLabelText("Sur-titre"), { target: { value: "Surtitre X" } });
    fireEvent.change(screen.getByLabelText("Titre"), { target: { value: "Titre X" } });
    fireEvent.change(screen.getByLabelText("Sous-titre"), { target: { value: "Sous X" } });

    fireEvent.click(screen.getByRole("button", { name: "Encarts" }));
    fireEvent.click(screen.getByRole("button", { name: "Ajouter" }));
    fireEvent.change(screen.getAllByLabelText("Titre encart")[0], { target: { value: "Card A" } });
    fireEvent.change(screen.getAllByLabelText("Contenu (1 ligne = 1 puce)")[0], {
      target: { value: "Bullet A" },
    });
    fireEvent.change(screen.getAllByLabelText("Titre encart")[1], { target: { value: "Card B" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Descendre" })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: "Monter" })[1]);
    fireEvent.click(screen.getAllByRole("button", { name: "Supprimer" })[0]);

    fireEvent.click(screen.getByRole("button", { name: "Liens et mots clefs" }));
    fireEvent.click(screen.getAllByRole("checkbox")[0]);
    fireEvent.change(screen.getAllByDisplayValue(/Voir les offres|Exemples d'impact|Promesse|A propos|Methode|Message/)[0], {
      target: { value: "Lien X" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Descendre" })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: "Monter" })[1]);

    fireEvent.click(screen.getByRole("button", { name: "Ajouter" }));
    fireEvent.change(screen.getAllByDisplayValue("")[0], { target: { value: "Keyword X" } });
    const keywordMoveButtons = screen.getAllByRole("button", { name: "Descendre" });
    fireEvent.click(keywordMoveButtons[keywordMoveButtons.length - 1]);
    fireEvent.click(screen.getAllByRole("button", { name: "Monter" })[1]);
    fireEvent.click(screen.getAllByRole("button", { name: "Descendre" })[1]);
    const keywordRemoveButtons = screen.getAllByRole("button", { name: "Supprimer" });
    fireEvent.click(keywordRemoveButtons[keywordRemoveButtons.length - 1]);

    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    expect(screen.getByText("Accueil mis a jour.")).toBeInTheDocument();
  });
});
