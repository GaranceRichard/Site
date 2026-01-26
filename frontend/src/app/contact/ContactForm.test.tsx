import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ContactForm from "./ContactForm";

describe("ContactForm", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
    cleanup();
  });

  function fillRequiredFields() {
    fireEvent.change(screen.getByLabelText("Nom"), {
      target: { value: "Ada Lovelace" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "ada@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Message"), {
      target: { value: "Bonjour" },
    });
    fireEvent.click(
      screen.getByRole("checkbox", {
        name: /J’accepte que mes informations soient utilisées/i,
      })
    );
  }

  it("ignore le honeypot et affiche le succÃ¨s", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "";

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<ContactForm />);
    fillRequiredFields();

    fireEvent.change(screen.getByLabelText("Website"), {
      target: { value: "bot" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));

    await waitFor(() => {
      expect(
        screen.getByText("Merci, votre message a bien été envoyé.")
      ).toBeInTheDocument();
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("affiche une erreur si l'API n'est pas configurée", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "";

    render(<ContactForm />);
    fillRequiredFields();

    fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));

    await waitFor(() => {
      expect(
        screen.getByText(
          "Erreur : Configuration API manquante (NEXT_PUBLIC_API_BASE_URL)."
        )
      ).toBeInTheDocument();
    });
  });

  it("soumet le formulaire et affiche le succès", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://example.com";

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({}),
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<ContactForm />);
    fillRequiredFields();

    fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));

    await waitFor(() => {
      expect(
        screen.getByText("Merci, votre message a bien été envoyé.")
      ).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://example.com/api/contact/messages",
      expect.objectContaining({
        method: "POST",
      })
    );
  });
});
