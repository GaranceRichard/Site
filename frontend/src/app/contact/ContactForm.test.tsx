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
    fireEvent.click(screen.getByRole("checkbox"));
  }

  it("ignore le honeypot et affiche le succÃ¨s", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "";

    const fetchMock = vi.fn();
    const onSuccess = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<ContactForm onSuccess={onSuccess} />);
    fillRequiredFields();

    fireEvent.change(screen.getByLabelText("Website"), {
      target: { value: "bot" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));

    await waitFor(() => {
      expect(screen.getByText(/Merci, votre message a bien/i)).toBeInTheDocument();
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("affiche une erreur si l'API n'est pas configurÃ©e", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "";

    render(<ContactForm />);
    fillRequiredFields();

    fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));

    await waitFor(() => {
      expect(
        screen.getByText(
          "Erreur : Configuration API manquante (NEXT_PUBLIC_API_BASE_URL).",
        ),
      ).toBeInTheDocument();
    });
  });

  it("soumet le formulaire et affiche le succÃ¨s", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://example.com";
    const onSuccess = vi.fn();

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({}),
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<ContactForm onSuccess={onSuccess} />);
    fillRequiredFields();

    fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));

    await waitFor(() => {
      expect(screen.getByText(/Merci, votre message a bien/i)).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://example.com/api/contact/messages",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("affiche le detail JSON quand l'API repond en erreur", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://example.com";

    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: vi.fn().mockResolvedValue({ detail: "Invalid payload" }),
      text: vi.fn().mockResolvedValue(""),
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<ContactForm />);
    fillRequiredFields();

    fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));

    await waitFor(() => {
      expect(screen.getByText(/Invalid payload/)).toBeInTheDocument();
    });
  });

  it("fallback sur res.text() si res.json() echoue", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://example.com";

    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn().mockRejectedValue(new Error("bad json")),
      text: vi.fn().mockResolvedValue("Server exploded"),
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<ContactForm />);
    fillRequiredFields();

    fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));

    await waitFor(() => {
      expect(screen.getByText(/Server exploded/)).toBeInTheDocument();
    });
  });

  it("affiche le fallback Erreur API si la reponse erreur est vide", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://example.com";

    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 418,
      json: vi.fn().mockRejectedValue(new Error("bad json")),
      text: vi.fn().mockResolvedValue(""),
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<ContactForm />);
    fillRequiredFields();

    fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));

    await waitFor(() => {
      expect(screen.getByText("Erreur : Erreur API (418)")).toBeInTheDocument();
    });
  });

  it("affiche une erreur de delai en cas de timeout reseau", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://example.com";
    process.env.NEXT_PUBLIC_CONTACT_TIMEOUT_MS = "5";

    const fetchMock = vi.fn((_url: string, init?: RequestInit) => {
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          reject(new DOMException("Aborted", "AbortError"));
        });
      });
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<ContactForm />);
    fillRequiredFields();

    fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));

    await waitFor(() => {
      expect(
        screen.getByText(/Erreur :\s*D[ée]lai d[ée]pass[ée]\. Veuillez r[ée]essayer\./i),
      ).toBeInTheDocument();
    });
  });

  it("affiche 'Erreur inattendue' quand l'erreur n'est pas une instance d'Error", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://example.com";

    const fetchMock = vi.fn().mockRejectedValue("plain failure");
    vi.stubGlobal("fetch", fetchMock);

    render(<ContactForm />);
    fillRequiredFields();

    fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));

    await waitFor(() => {
      expect(screen.getByText("Erreur : Erreur inattendue")).toBeInTheDocument();
    });
  });
});
