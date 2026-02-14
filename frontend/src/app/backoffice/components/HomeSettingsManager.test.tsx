import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import HomeSettingsManager from "./HomeSettingsManager";

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
    fireEvent.click(screen.getAllByRole("button", { name: "Descendre" })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: "Monter" })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: "Supprimer" })[0]);

    fireEvent.click(screen.getByRole("button", { name: "Liens et mots clefs" }));
    fireEvent.click(screen.getAllByRole("checkbox")[0]);
    fireEvent.change(screen.getAllByDisplayValue(/Voir les offres|Exemples d'impact|Promesse|A propos|Methode|Message/)[0], {
      target: { value: "Lien X" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Descendre" })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: "Monter" })[0]);

    fireEvent.click(screen.getByRole("button", { name: "Ajouter" }));
    fireEvent.change(screen.getAllByDisplayValue("")[0], { target: { value: "Keyword X" } });
    const keywordMoveButtons = screen.getAllByRole("button", { name: "Descendre" });
    fireEvent.click(keywordMoveButtons[keywordMoveButtons.length - 1]);
    const keywordRemoveButtons = screen.getAllByRole("button", { name: "Supprimer" });
    fireEvent.click(keywordRemoveButtons[keywordRemoveButtons.length - 1]);

    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));
    expect(screen.getByText("Accueil mis a jour.")).toBeInTheDocument();
  });
});
