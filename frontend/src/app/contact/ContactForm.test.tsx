import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ContactForm from "./ContactForm";

const trackEventMock = vi.fn();

vi.mock("../lib/analytics", () => ({
  ANALYTICS_EVENTS: {
    CONTACT_FORM_ATTEMPT: "contact_form_attempt",
    CONTACT_FORM_SUCCESS: "contact_form_success",
  },
  trackEvent: (...args: unknown[]) => trackEventMock(...args),
}));

describe("ContactForm", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
    trackEventMock.mockReset();
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

  it("ignore le honeypot et affiche le succes", async () => {
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

  it("affiche une erreur si l'API n'est pas configuree", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "";
    const fetchMock = vi.fn().mockRejectedValue(new Error("boom"));
    vi.stubGlobal("fetch", fetchMock);

    render(<ContactForm />);
    fillRequiredFields();

    fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));

    await waitFor(() => {
      expect(
        screen.getByText("Erreur : boom"),
      ).toBeInTheDocument();
    });
  });

  it("soumet le formulaire et affiche le succes", async () => {
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
      "/api-proxy/api/contact/messages",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(trackEventMock).toHaveBeenCalledWith("contact_form_attempt");
    expect(trackEventMock).toHaveBeenCalledWith("contact_form_success");
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("trim le payload et preserve subject/source sur le POST", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://example.com";

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({}),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<ContactForm />);

    fireEvent.change(screen.getByLabelText("Nom"), {
      target: { value: "  Ada Lovelace  " },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "  ada@example.com  " },
    });
    fireEvent.change(screen.getByLabelText("Sujet"), {
      target: { value: "  Sujet test  " },
    });
    fireEvent.change(screen.getByLabelText("Message"), {
      target: { value: "  Bonjour trim  " },
    });
    fireEvent.click(screen.getByRole("checkbox"));

    fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({
      name: "Ada Lovelace",
      email: "ada@example.com",
      subject: "Sujet test",
      message: "Bonjour trim",
      consent: true,
      source: "contact-page",
    });
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
        screen.getByText(/Erreur :\s*Delai depasse\. Veuillez reessayer\./i),
      ).toBeInTheDocument();
    });
  });

  it("clear le timer en succes", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://example.com";
    const clearTimeoutSpy = vi.spyOn(window, "clearTimeout");

    const successFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({}),
    });
    vi.stubGlobal("fetch", successFetch);

    render(<ContactForm />);
    fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));

    await waitFor(() => {
      expect(screen.getByText(/Merci, votre message a bien/i)).toBeInTheDocument();
    });

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it("clear le timer en erreur", async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://example.com";
    const clearTimeoutSpy = vi.spyOn(window, "clearTimeout");
    const errorFetch = vi.fn().mockRejectedValue(new Error("network down"));
    vi.stubGlobal("fetch", errorFetch);

    render(<ContactForm />);
    fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));

    await waitFor(() => {
      expect(screen.getByText("Erreur : network down")).toBeInTheDocument();
    });

    expect(clearTimeoutSpy).toHaveBeenCalled();
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
