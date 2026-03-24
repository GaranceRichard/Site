import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PublicationsSettingsManager from "./PublicationsSettingsManager";
import {
  DEFAULT_HEADER_SETTINGS,
  DEFAULT_HOME_HERO_SETTINGS,
  DEFAULT_METHOD_SETTINGS,
  DEFAULT_PROMISE_SETTINGS,
  DEFAULT_PUBLICATIONS_SETTINGS,
  resetSiteSettingsStoreForTests,
} from "../../content/siteSettingsStore";

describe("PublicationsSettingsManager", () => {
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
            promise: DEFAULT_PROMISE_SETTINGS,
            method: DEFAULT_METHOD_SETTINGS,
            publications: {
              ...DEFAULT_PUBLICATIONS_SETTINGS,
              title: "Nouvelles publications",
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

  it("saves publications settings when form is valid", async () => {
    render(<PublicationsSettingsManager />);

    fireEvent.change(screen.getByLabelText("Titre"), {
      target: { value: "Nouvelles publications" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(screen.getByText("Publications mises a jour.")).toBeInTheDocument();
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

  it("filters out empty publications before saving", async () => {
    render(<PublicationsSettingsManager />);
    fireEvent.click(screen.getByRole("button", { name: "Publications" }));

    const textboxes = screen.getAllByRole("textbox");
    fireEvent.change(textboxes[0], { target: { value: "   " } });
    fireEvent.change(textboxes[1], { target: { value: "   " } });

    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(screen.getByText("Publications mises a jour.")).toBeInTheDocument();
    });

    expect(vi.mocked(fetch)).toHaveBeenLastCalledWith(
      "/api-proxy/api/settings/admin/",
      expect.objectContaining({
        body: expect.not.stringContaining("\"title\":\"\",\"content\":\"\""),
      }),
    );
  });

  it("shows an error when mandatory fields are empty", async () => {
    render(<PublicationsSettingsManager />);
    fireEvent.click(screen.getByRole("button", { name: "Encart" }));
    fireEvent.change(screen.getByLabelText("Titre encart"), {
      target: { value: "   " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(
        screen.getByText("Le titre, le sous-titre et l'encart sont obligatoires."),
      ).toBeInTheDocument();
    });
  });

  it("shows an auth error when token lookup fails", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("session unavailable");
    });

    render(<PublicationsSettingsManager />);
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
            method: DEFAULT_METHOD_SETTINGS,
            publications: DEFAULT_PUBLICATIONS_SETTINGS,
          }),
        })
        .mockRejectedValueOnce("boom"),
    );

    render(<PublicationsSettingsManager />);
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
            method: DEFAULT_METHOD_SETTINGS,
            publications: DEFAULT_PUBLICATIONS_SETTINGS,
          }),
        })
        .mockRejectedValueOnce(new Error("Sauvegarde impossible")),
    );

    render(<PublicationsSettingsManager />);
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(screen.getByText("Sauvegarde impossible")).toBeInTheDocument();
    });
  });

  it("limits publications to 4", () => {
    render(<PublicationsSettingsManager />);
    fireEvent.click(screen.getByRole("button", { name: "Publications" }));

    const addButton = screen.getByRole("button", { name: "Ajouter" });
    for (let index = 0; index < 3; index += 1) {
      fireEvent.click(addButton);
    }

    expect(screen.getByText("Publication 4")).toBeInTheDocument();
    expect(addButton).toBeDisabled();
  });

  it("handles an empty publications list before adding the first one", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          header: DEFAULT_HEADER_SETTINGS,
          homeHero: DEFAULT_HOME_HERO_SETTINGS,
          promise: DEFAULT_PROMISE_SETTINGS,
          method: DEFAULT_METHOD_SETTINGS,
          publications: {
            ...DEFAULT_PUBLICATIONS_SETTINGS,
            items: [],
          },
        }),
      }),
    );

    render(<PublicationsSettingsManager />);
    fireEvent.click(screen.getByRole("button", { name: "Publications" }));

    await waitFor(() => {
      expect(screen.queryByLabelText("Titre publication")).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Ajouter" }));

    expect(screen.getByText(/^Publication 1$/)).toBeInTheDocument();
    expect(screen.getByLabelText("Titre publication")).toHaveValue("Nouvelle publication");
  });

  it("can switch between tabs", () => {
    render(<PublicationsSettingsManager />);

    fireEvent.click(screen.getByRole("button", { name: "Encart" }));
    expect(screen.getByLabelText("Titre encart")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Publications" }));
    expect(screen.getByRole("button", { name: "Ajouter" })).toBeInTheDocument();
    expect(screen.getByText("Texte publication")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Facilitati" }));
    expect(screen.getByDisplayValue("Facilitation - ateliers decisifs et alignement")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Titres" }));
    expect(screen.getByLabelText("Sous-titre")).toBeInTheDocument();
  });

  it("can edit subtitle and highlight content", () => {
    render(<PublicationsSettingsManager />);

    fireEvent.change(screen.getByLabelText("Sous-titre"), {
      target: { value: "Sous-titre revise" },
    });
    expect(screen.getByDisplayValue("Sous-titre revise")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Encart" }));
    fireEvent.change(screen.getByLabelText("Contenu encart"), {
      target: { value: "Ligne 1\nLigne 2" },
    });

    expect(screen.getByLabelText("Contenu encart")).toHaveValue("Ligne 1\nLigne 2");
  });

  it("can edit, reorder and remove publications", () => {
    render(<PublicationsSettingsManager />);
    fireEvent.click(screen.getByRole("button", { name: "Publications" }));

    fireEvent.change(screen.getByLabelText("Titre publication"), {
      target: { value: "Publication A" },
    });
    fireEvent.change(screen.getByLabelText("Texte publication"), {
      target: { value: "Contenu A" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Descendre" }));
    expect(screen.getByDisplayValue("Publication A")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Supprimer" }));
    expect(screen.queryByDisplayValue("Publication A")).not.toBeInTheDocument();
  });

  it("can move a publication upward", () => {
    render(<PublicationsSettingsManager />);
    fireEvent.click(screen.getByRole("button", { name: "Publications" }));
    fireEvent.click(screen.getByRole("button", { name: "Facilitati" }));

    fireEvent.change(screen.getByLabelText("Titre publication"), {
      target: { value: "Publication B" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Monter" }));

    expect(screen.getByDisplayValue("Publication B")).toBeInTheDocument();
  });

  it("can add and remove up to 3 links per publication", () => {
    render(<PublicationsSettingsManager />);
    fireEvent.click(screen.getByRole("button", { name: "Publications" }));

    const addLinkButtons = screen.getAllByRole("button", { name: "Ajouter un lien" });
    fireEvent.click(addLinkButtons[0]);
    fireEvent.click(addLinkButtons[0]);

    const firstPublication = screen.getByText("Publication 1").closest("div");
    expect(firstPublication).not.toBeNull();
    const publicationScope = within(firstPublication as HTMLElement);

    expect(publicationScope.getAllByText("Titre du lien")).toHaveLength(3);
    fireEvent.change(publicationScope.getAllByLabelText("URL")[1], {
      target: { value: "https://example.com/nouvelle-reference" },
    });
    expect(
      publicationScope.getByDisplayValue("https://example.com/nouvelle-reference"),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Ajouter un lien" })[0]).toBeDisabled();

    fireEvent.click(publicationScope.getAllByRole("button", { name: "Supprimer le lien" })[0]);

    expect(publicationScope.getAllByText("Titre du lien")).toHaveLength(2);
  });

  it("supports legacy publications without links and normalizes them on save", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            header: DEFAULT_HEADER_SETTINGS,
            homeHero: DEFAULT_HOME_HERO_SETTINGS,
            promise: DEFAULT_PROMISE_SETTINGS,
            method: DEFAULT_METHOD_SETTINGS,
            publications: {
              ...DEFAULT_PUBLICATIONS_SETTINGS,
              items: [{ id: "publication-1", title: "Publication legacy", content: "Texte legacy" }],
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            header: DEFAULT_HEADER_SETTINGS,
            homeHero: DEFAULT_HOME_HERO_SETTINGS,
            promise: DEFAULT_PROMISE_SETTINGS,
            method: DEFAULT_METHOD_SETTINGS,
            publications: {
              ...DEFAULT_PUBLICATIONS_SETTINGS,
              items: [
                {
                  id: "publication-1",
                  title: "Publication legacy",
                  content: "Texte legacy",
                  links: [
                    {
                      id: "publication-1-link-1",
                      title: "Reference legacy",
                      url: "https://example.com/legacy",
                    },
                  ],
                },
              ],
            },
          }),
          text: async () => "",
        }),
    );

    render(<PublicationsSettingsManager />);
    fireEvent.click(screen.getByRole("button", { name: "Publications" }));
    await waitFor(() => {
      expect(screen.getByDisplayValue("Publication legacy")).toBeInTheDocument();
    });

    const firstPublication = screen.getByText("Publication 1").closest("div");
    expect(firstPublication).not.toBeNull();
    const publicationScope = within(firstPublication as HTMLElement);

    fireEvent.click(publicationScope.getByRole("button", { name: "Ajouter un lien" }));
    fireEvent.change(publicationScope.getAllByLabelText("Titre du lien")[0], {
      target: { value: "Reference legacy" },
    });
    fireEvent.change(publicationScope.getAllByLabelText("URL")[0], {
      target: { value: "https://example.com/legacy" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(screen.getByText("Publications mises a jour.")).toBeInTheDocument();
    });
  });
});
