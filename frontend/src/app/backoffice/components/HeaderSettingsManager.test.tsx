import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import HeaderSettingsManager from "./HeaderSettingsManager";

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
});
