import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import HeaderSettingsManager from "./HeaderSettingsManager";
import { DEFAULT_HEADER_SETTINGS, setHeaderSettings } from "../../content/headerSettings";

const HEADER_SETTINGS_KEY = "site_header_settings";

describe("HeaderSettingsManager", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    window.localStorage.removeItem(HEADER_SETTINGS_KEY);
  });

  it("saves header settings when form is valid", () => {
    render(<HeaderSettingsManager />);

    fireEvent.change(screen.getByLabelText("Nom"), { target: { value: "Jane Doe" } });
    fireEvent.change(screen.getByLabelText("Titre"), { target: { value: "Coach Agile" } });
    fireEvent.change(screen.getByLabelText("Adresse de prise de rendez-vous"), {
      target: { value: "https://example.com/booking" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(screen.getByText("Header mis a jour.")).toBeInTheDocument();
    expect(window.localStorage.getItem(HEADER_SETTINGS_KEY)).toBe(
      JSON.stringify({
        name: "Jane Doe",
        title: "Coach Agile",
        bookingUrl: "https://example.com/booking",
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

  it("shows an error when URL parsing throws", () => {
    render(<HeaderSettingsManager />);
    const urlSpy = vi
      .spyOn(globalThis, "URL")
      .mockImplementation(() => {
        throw new TypeError("bad url");
      });

    fireEvent.change(screen.getByLabelText("Adresse de prise de rendez-vous"), {
      target: { value: "https://example.com/booking" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(
      screen.getByText("L'adresse de prise de rendez-vous doit etre une URL http(s) valide."),
    ).toBeInTheDocument();
    urlSpy.mockRestore();
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

  it("restores default values", () => {
    render(<HeaderSettingsManager />);

    fireEvent.change(screen.getByLabelText("Nom"), { target: { value: "Custom Name" } });
    fireEvent.click(screen.getByRole("button", { name: "Reinitialiser" }));

    expect(screen.getByDisplayValue(DEFAULT_HEADER_SETTINGS.name)).toBeInTheDocument();
    expect(screen.getByText("Valeurs par defaut restaurees.")).toBeInTheDocument();
  });

  it("resynchronizes the form when persisted settings change", async () => {
    render(<HeaderSettingsManager />);

    fireEvent.change(screen.getByLabelText("Nom"), { target: { value: "Unsaved Name" } });
    setHeaderSettings({
      name: "Persisted Name",
      title: "Persisted Title",
      bookingUrl: "https://example.com/persisted",
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue("Persisted Name")).toBeInTheDocument();
    });
    expect(screen.getByDisplayValue("Persisted Title")).toBeInTheDocument();
    expect(screen.getByDisplayValue("https://example.com/persisted")).toBeInTheDocument();
  });
});
