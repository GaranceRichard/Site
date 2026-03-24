import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import HeaderSettingsManager from "./HeaderSettingsManager";
import { DEFAULT_HEADER_SETTINGS, setHeaderSettings } from "../../content/headerSettings";
import { resetSiteSettingsStoreForTests } from "../../content/siteSettingsStore";

describe("HeaderSettingsManager", () => {
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
            homeHero: {
              eyebrow: "Eyebrow",
              title: "Title",
              subtitle: "Subtitle",
              links: [],
              keywords: ["Clarte"],
              cards: [{ id: "card-1", title: "Card", content: "Content" }],
            },
          }),
        })
        .mockResolvedValue({
          ok: true,
          json: async () => ({
            header: {
              name: "Jane Doe",
              title: "Coach Agile",
              bookingUrl: "https://example.com/booking",
            },
            homeHero: {
              eyebrow: "Eyebrow",
              title: "Title",
              subtitle: "Subtitle",
              links: [],
              keywords: ["Clarte"],
              cards: [{ id: "card-1", title: "Card", content: "Content" }],
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

  it("saves header settings when form is valid", async () => {
    render(<HeaderSettingsManager />);

    fireEvent.change(screen.getByLabelText("Nom"), { target: { value: "Jane Doe" } });
    fireEvent.change(screen.getByLabelText("Titre"), { target: { value: "Coach Agile" } });
    fireEvent.change(screen.getByLabelText("Adresse de prise de rendez-vous"), {
      target: { value: "https://example.com/booking" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(screen.getByText("Header mis a jour.")).toBeInTheDocument();
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

  it("shows an error for invalid booking URL", () => {
    render(<HeaderSettingsManager />);

    fireEvent.change(screen.getByLabelText("Adresse de prise de rendez-vous"), {
      target: { value: "ftp://example.com/booking" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(
      screen.getByText("L'adresse de prise de rendez-vous doit etre une URL http(s) valide."),
    ).toBeInTheDocument();
  });

  it("shows an error for malformed booking URL", () => {
    const originalUrl = globalThis.URL;
    vi.stubGlobal(
      "URL",
      class MockUrl {
        constructor() {
          throw new TypeError("invalid url");
        }
      } as typeof URL,
    );

    try {
      render(<HeaderSettingsManager />);

      fireEvent.change(screen.getByLabelText("Adresse de prise de rendez-vous"), {
        target: { value: "https://example.com/booking" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

      expect(
        screen.getByText("L'adresse de prise de rendez-vous doit etre une URL http(s) valide."),
      ).toBeInTheDocument();
    } finally {
      vi.stubGlobal("URL", originalUrl);
    }
  });

  it("shows an error when required fields are empty", () => {
    render(<HeaderSettingsManager />);

    fireEvent.change(screen.getByLabelText("Nom"), { target: { value: "   " } });
    fireEvent.change(screen.getByLabelText("Titre"), { target: { value: "   " } });
    fireEvent.change(screen.getByLabelText("Adresse de prise de rendez-vous"), {
      target: { value: "   " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(screen.getByText("Tous les champs sont obligatoires.")).toBeInTheDocument();
  });

  it("shows an auth error when token lookup fails on submit", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("session unavailable");
    });

    render(<HeaderSettingsManager />);

    fireEvent.change(screen.getByLabelText("Nom"), { target: { value: "Jane Doe" } });
    fireEvent.change(screen.getByLabelText("Titre"), { target: { value: "Coach Agile" } });
    fireEvent.change(screen.getByLabelText("Adresse de prise de rendez-vous"), {
      target: { value: "https://example.com/booking" },
    });

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
            homeHero: {
              eyebrow: "Eyebrow",
              title: "Title",
              subtitle: "Subtitle",
              links: [],
              keywords: ["Clarte"],
              cards: [{ id: "card-1", title: "Card", content: "Content" }],
            },
          }),
        })
        .mockRejectedValueOnce(new Error("Sauvegarde impossible")),
    );

    render(<HeaderSettingsManager />);

    fireEvent.change(screen.getByLabelText("Nom"), { target: { value: "Jane Doe" } });
    fireEvent.change(screen.getByLabelText("Titre"), { target: { value: "Coach Agile" } });
    fireEvent.change(screen.getByLabelText("Adresse de prise de rendez-vous"), {
      target: { value: "https://example.com/booking" },
    });

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
            homeHero: {
              eyebrow: "Eyebrow",
              title: "Title",
              subtitle: "Subtitle",
              links: [],
              keywords: ["Clarte"],
              cards: [{ id: "card-1", title: "Card", content: "Content" }],
            },
          }),
        })
        .mockRejectedValueOnce("boom"),
    );

    render(<HeaderSettingsManager />);

    fireEvent.change(screen.getByLabelText("Nom"), { target: { value: "Jane Doe" } });
    fireEvent.change(screen.getByLabelText("Titre"), { target: { value: "Coach Agile" } });
    fireEvent.change(screen.getByLabelText("Adresse de prise de rendez-vous"), {
      target: { value: "https://example.com/booking" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(screen.getByText("Erreur API")).toBeInTheDocument();
    });
  });

  it("restores default values", async () => {
    render(<HeaderSettingsManager />);

    fireEvent.change(screen.getByLabelText("Nom"), { target: { value: "Custom Name" } });
    fireEvent.click(screen.getByRole("button", { name: "Reinitialiser" }));

    await waitFor(() => {
      expect(screen.getByText("Valeurs par defaut restaurees.")).toBeInTheDocument();
    });
  });

  it("shows an auth error when token lookup fails on reset", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("session unavailable");
    });

    render(<HeaderSettingsManager />);

    fireEvent.click(screen.getByRole("button", { name: "Reinitialiser" }));

    await waitFor(() => {
      expect(
        screen.getByText("Connexion requise pour enregistrer ces changements."),
      ).toBeInTheDocument();
    });
  });

  it("shows the fallback error when reset rejects with a non-error value", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            header: DEFAULT_HEADER_SETTINGS,
            homeHero: {
              eyebrow: "Eyebrow",
              title: "Title",
              subtitle: "Subtitle",
              links: [],
              keywords: ["Clarte"],
              cards: [{ id: "card-1", title: "Card", content: "Content" }],
            },
          }),
        })
        .mockRejectedValueOnce("boom"),
    );

    render(<HeaderSettingsManager />);

    fireEvent.click(screen.getByRole("button", { name: "Reinitialiser" }));

    await waitFor(() => {
      expect(screen.getByText("Erreur API")).toBeInTheDocument();
    });
  });

  it("shows the API error message when reset fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            header: DEFAULT_HEADER_SETTINGS,
            homeHero: {
              eyebrow: "Eyebrow",
              title: "Title",
              subtitle: "Subtitle",
              links: [],
              keywords: ["Clarte"],
              cards: [{ id: "card-1", title: "Card", content: "Content" }],
            },
          }),
        })
        .mockRejectedValueOnce(new Error("Reinitialisation impossible")),
    );

    render(<HeaderSettingsManager />);

    fireEvent.click(screen.getByRole("button", { name: "Reinitialiser" }));

    await waitFor(() => {
      expect(screen.getByText("Reinitialisation impossible")).toBeInTheDocument();
    });
  });

  it("resynchronizes the form when persisted settings change", async () => {
    render(<HeaderSettingsManager />);

    await waitFor(() => {
      expect(screen.getByDisplayValue(DEFAULT_HEADER_SETTINGS.name)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Nom"), { target: { value: "Unsaved Name" } });
    setHeaderSettings({
      name: "Persisted Name",
      title: "Persisted Title",
      bookingUrl: "https://example.com/persisted",
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue("Persisted Name")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Persisted Title")).toBeInTheDocument();
      expect(screen.getByDisplayValue("https://example.com/persisted")).toBeInTheDocument();
    });
  });
});
