import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import MethodSettingsManager from "./MethodSettingsManager";
import { normalizeMethodSettingsForSubmit } from "../../content/methodSubmit";
import {
  DEFAULT_HEADER_SETTINGS,
  DEFAULT_HOME_HERO_SETTINGS,
  DEFAULT_METHOD_SETTINGS,
  DEFAULT_PROMISE_SETTINGS,
  resetSiteSettingsStoreForTests,
} from "../../content/siteSettingsStore";

describe("MethodSettingsManager", () => {
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
            method: DEFAULT_METHOD_SETTINGS,
          }),
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({
            header: DEFAULT_HEADER_SETTINGS,
            homeHero: DEFAULT_HOME_HERO_SETTINGS,
            promise: DEFAULT_PROMISE_SETTINGS,
            method: {
              ...DEFAULT_METHOD_SETTINGS,
              title: "Nouvelle approche",
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

  it("normalizes payloads before submit", () => {
    expect(
      normalizeMethodSettingsForSubmit({
        eyebrow: " Approche ",
        title: " Methode ",
        subtitle: " Stabiliser ",
        steps: [
          { id: "a", step: " ", title: " Observer ", text: " Comprendre " },
          { id: "b", step: "02", title: " ", text: " " },
        ],
      }),
    ).toEqual({
      eyebrow: "Approche",
      title: "Methode",
      subtitle: "Stabiliser",
      steps: [{ id: "a", step: "01", title: "Observer", text: "Comprendre" }],
    });
  });

  it("saves method settings when form is valid", async () => {
    render(<MethodSettingsManager />);

    fireEvent.change(screen.getByLabelText("Surtitre"), {
      target: { value: "Approche revisee" },
    });
    fireEvent.change(screen.getByLabelText("Titre"), {
      target: { value: "Nouvelle approche" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(screen.getByText("Approche mise a jour.")).toBeInTheDocument();
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

  it("shows an error when mandatory fields are empty", () => {
    render(<MethodSettingsManager />);

    fireEvent.change(screen.getByLabelText("Surtitre"), {
      target: { value: "   " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(screen.getByText("Le surtitre, le titre et le sous-titre sont obligatoires.")).toBeInTheDocument();
  });

  it("shows an auth error when token lookup fails", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("session unavailable");
    });

    render(<MethodSettingsManager />);
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
          }),
        })
        .mockRejectedValueOnce("boom"),
    );

    render(<MethodSettingsManager />);
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
          }),
        })
        .mockRejectedValueOnce(new Error("Sauvegarde impossible")),
    );

    render(<MethodSettingsManager />);
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(screen.getByText("Sauvegarde impossible")).toBeInTheDocument();
    });
  });

  it("limits steps to 6", () => {
    render(<MethodSettingsManager />);
    fireEvent.click(screen.getByRole("button", { name: "Etapes" }));

    const addButton = screen.getByRole("button", { name: "Ajouter" });
    fireEvent.click(addButton);
    fireEvent.click(addButton);

    expect(screen.getByText("Etape 6")).toBeInTheDocument();
    expect(addButton).toBeDisabled();
  });

  it("can add a step", () => {
    render(<MethodSettingsManager />);
    fireEvent.change(screen.getByLabelText("Sous-titre"), {
      target: { value: "Sous-titre modifie" },
    });
    expect(screen.getByDisplayValue("Sous-titre modifie")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Etapes" }));

    fireEvent.click(screen.getByRole("button", { name: "Ajouter" }));

    expect(screen.getByDisplayValue("Nouvelle etape")).toBeInTheDocument();
    expect(screen.getByDisplayValue("05")).toBeInTheDocument();
  });

  it("can switch between tabs", () => {
    render(<MethodSettingsManager />);

    fireEvent.click(screen.getByRole("button", { name: "Etapes" }));
    expect(screen.getByRole("button", { name: "Ajouter" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Titres" }));
    expect(screen.getByLabelText("Sous-titre")).toBeInTheDocument();
  });

  it("can edit, reorder and remove steps", () => {
    render(<MethodSettingsManager />);
    fireEvent.click(screen.getByRole("button", { name: "Etapes" }));

    const textboxes = screen.getAllByRole("textbox");
    fireEvent.change(textboxes[0], { target: { value: "11" } });
    fireEvent.change(textboxes[1], { target: { value: "Observer le flux" } });
    fireEvent.change(textboxes[2], { target: { value: "Regarder le systeme" } });

    expect(screen.getByDisplayValue("11")).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Descendre" })[0]);
    expect(screen.getByDisplayValue("Observer le flux")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "Supprimer" })[1]);
    expect(screen.queryByDisplayValue("Observer le flux")).not.toBeInTheDocument();
  });

  it("can move a step upward", () => {
    render(<MethodSettingsManager />);
    fireEvent.click(screen.getByRole("button", { name: "Etapes" }));

    const textboxes = screen.getAllByRole("textbox");
    fireEvent.change(textboxes[4], { target: { value: "Prioriser" } });

    fireEvent.click(screen.getAllByRole("button", { name: "Monter" })[1]);

    expect(screen.getByDisplayValue("Prioriser")).toBeInTheDocument();
  });

  it("normalizes empty step numbers before saving", async () => {
    render(<MethodSettingsManager />);
    fireEvent.click(screen.getByRole("button", { name: "Etapes" }));

    const textboxes = screen.getAllByRole("textbox");
    fireEvent.change(textboxes[0], { target: { value: "   " } });
    fireEvent.change(textboxes[1], { target: { value: "Observer" } });
    fireEvent.change(textboxes[2], { target: { value: "Comprendre le flux" } });

    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(screen.getByText("Approche mise a jour.")).toBeInTheDocument();
    });

    expect(vi.mocked(fetch)).toHaveBeenLastCalledWith(
      "/api-proxy/api/settings/admin/",
      expect.objectContaining({
        body: expect.stringContaining("\"step\":\"01\""),
      }),
    );
  });

  it("filters out empty steps before saving", async () => {
    render(<MethodSettingsManager />);
    fireEvent.click(screen.getByRole("button", { name: "Etapes" }));

    const textboxes = screen.getAllByRole("textbox");
    fireEvent.change(textboxes[1], { target: { value: "   " } });
    fireEvent.change(textboxes[2], { target: { value: "   " } });

    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(screen.getByText("Approche mise a jour.")).toBeInTheDocument();
    });

    expect(vi.mocked(fetch)).toHaveBeenLastCalledWith(
      "/api-proxy/api/settings/admin/",
      expect.objectContaining({
        body: expect.not.stringContaining("\"title\":\"\",\"text\":\"\""),
      }),
    );
  });
});
