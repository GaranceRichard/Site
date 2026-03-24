import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ContentExchangeManager from "./ContentExchangeManager";

const replaceSiteSettingsMock = vi.fn();
const invalidateReferencesCacheMock = vi.fn();
const fetchMock = vi.fn();
const createObjectUrlMock = vi.fn(() => "blob:test");
const revokeObjectUrlMock = vi.fn();
const clickMock = vi.fn();

vi.mock("../../content/siteSettingsStore", () => ({
  replaceSiteSettings: (value: unknown) => replaceSiteSettingsMock(value),
}));

vi.mock("../../lib/references", () => ({
  invalidateReferencesCache: () => invalidateReferencesCacheMock(),
}));

describe("ContentExchangeManager", () => {
  beforeEach(() => {
    replaceSiteSettingsMock.mockReset();
    invalidateReferencesCacheMock.mockReset();
    fetchMock.mockReset();
    clickMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("URL", {
      createObjectURL: createObjectUrlMock,
      revokeObjectURL: revokeObjectUrlMock,
    });
    sessionStorage.setItem("access_token", "token-123");
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      if (tagName === "a") {
        const element = originalCreateElement("a");
        element.click = clickMock;
        return element;
      }
      return originalCreateElement(tagName);
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("loads the template and can download export", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response("format_version = 1\n", { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(new Blob(["file"], { type: "application/toml" }), {
          status: 200,
          headers: { "Content-Disposition": 'attachment; filename="export.toml"' },
        }),
      );

    render(<ContentExchangeManager apiBase="http://example.test" onRequestLogin={vi.fn()} />);

    await waitFor(() =>
      expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toContain(
        "format_version = 1",
      ),
    );

    fireEvent.click(screen.getByRole("button", { name: "Telecharger l'extraction" }));

    await waitFor(() => expect(clickMock).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledWith(
      "http://example.test/api/contact/exchange/admin/export",
      expect.objectContaining({
        headers: { Authorization: "Bearer token-123" },
      }),
    );
  });

  it("can download the template file", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response("format_version = 1\n", { status: 200 }))
      .mockResolvedValueOnce(
        new Response(new Blob(["template"], { type: "application/toml" }), {
          status: 200,
          headers: { "Content-Disposition": 'attachment; filename="template.toml"' },
        }),
      );

    render(<ContentExchangeManager apiBase="http://example.test" onRequestLogin={vi.fn()} />);

    await waitFor(() =>
      expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toContain(
        "format_version = 1",
      ),
    );

    fireEvent.click(screen.getByRole("button", { name: "Telecharger le canevas" }));

    await waitFor(() =>
      expect(screen.getByText("Canevas telecharge.")).toBeInTheDocument(),
    );
  });

  it("falls back to a default filename when download headers are missing", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response("format_version = 1\n", { status: 200 }))
      .mockResolvedValueOnce(new Response(new Blob(["export"], { type: "application/toml" }), { status: 200 }));

    render(<ContentExchangeManager apiBase="http://example.test" onRequestLogin={vi.fn()} />);

    await waitFor(() =>
      expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toContain(
        "format_version = 1",
      ),
    );

    fireEvent.click(screen.getByRole("button", { name: "Telecharger l'extraction" }));
    await waitFor(() => expect(clickMock).toHaveBeenCalled());
  });

  it("uploads a file and refreshes frontend caches", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response("format_version = 1\n", { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            detail: "Import termine.",
            references_count: 2,
            settings: { header: { name: "X" } },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );

    render(<ContentExchangeManager apiBase="http://example.test" onRequestLogin={vi.fn()} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["format_version = 1"], "import.toml", {
      type: "text/plain",
    });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() =>
      expect(screen.getByText("Import termine: 2 reference(s) rechargee(s).")).toBeInTheDocument(),
    );
    expect(replaceSiteSettingsMock).toHaveBeenCalledWith({ header: { name: "X" } });
    expect(invalidateReferencesCacheMock).toHaveBeenCalled();
  });

  it("shows a configuration error when apiBase is missing", async () => {
    render(<ContentExchangeManager apiBase={undefined} onRequestLogin={vi.fn()} />);

    expect(
      await screen.findByText("Configuration manquante : NEXT_PUBLIC_API_BASE_URL."),
    ).toBeInTheDocument();
  });

  it("handles template loading errors", async () => {
    fetchMock.mockResolvedValueOnce(new Response("template boom", { status: 500 }));

    render(<ContentExchangeManager apiBase="http://example.test" onRequestLogin={vi.fn()} />);

    expect(await screen.findByText("template boom")).toBeInTheDocument();
  });

  it("handles unexpected thrown values during template and download loading", async () => {
    fetchMock.mockRejectedValueOnce("template crashed");

    render(<ContentExchangeManager apiBase="http://example.test" onRequestLogin={vi.fn()} />);

    expect(await screen.findByText("Erreur inattendue.")).toBeInTheDocument();

    cleanup();
    fetchMock
      .mockResolvedValueOnce(new Response("format_version = 1\n", { status: 200 }))
      .mockRejectedValueOnce("download crashed");

    render(<ContentExchangeManager apiBase="http://example.test" onRequestLogin={vi.fn()} />);
    await waitFor(() =>
      expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toContain(
        "format_version = 1",
      ),
    );

    fireEvent.click(screen.getByRole("button", { name: "Telecharger l'extraction" }));
    expect(await screen.findAllByText("Erreur inattendue.")).not.toHaveLength(0);
  });

  it("reopens login when template loading returns 401", async () => {
    const onRequestLogin = vi.fn();
    fetchMock.mockResolvedValueOnce(new Response("", { status: 401 }));

    render(<ContentExchangeManager apiBase="http://example.test" onRequestLogin={onRequestLogin} />);

    await waitFor(() => expect(onRequestLogin).toHaveBeenCalled());
  });

  it("handles missing apiBase during download and import actions", async () => {
    render(<ContentExchangeManager apiBase={undefined} onRequestLogin={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Telecharger l'extraction" }));
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["format_version = 1"], "import.toml", { type: "text/plain" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(
      await screen.findByText("Configuration manquante : NEXT_PUBLIC_API_BASE_URL."),
    ).toBeInTheDocument();
  });

  it("handles download and import API errors", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response("format_version = 1\n", { status: 200 }))
      .mockResolvedValueOnce(new Response("boom export", { status: 500 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ detail: { header: "invalid" } }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }),
      );

    render(<ContentExchangeManager apiBase="http://example.test" onRequestLogin={vi.fn()} />);

    await waitFor(() =>
      expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toContain(
        "format_version = 1",
      ),
    );

    fireEvent.click(screen.getByRole("button", { name: "Telecharger l'extraction" }));
    expect(await screen.findByText("boom export")).toBeInTheDocument();

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["format_version = 1"], "import.toml", { type: "text/plain" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(await screen.findByText('{"header":"invalid"}')).toBeInTheDocument();
  });

  it("handles import errors with string or missing detail", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response("format_version = 1\n", { status: 200 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ detail: "Fichier invalide" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({}), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }),
      );

    render(<ContentExchangeManager apiBase="http://example.test" onRequestLogin={vi.fn()} />);

    await waitFor(() =>
      expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toContain(
        "format_version = 1",
      ),
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["format_version = 1"], "import.toml", { type: "text/plain" });
    fireEvent.change(fileInput, { target: { files: [file] } });
    expect(await screen.findByText("Fichier invalide")).toBeInTheDocument();

    fireEvent.change(fileInput, { target: { files: [file] } });
    expect(await screen.findByText("Erreur inattendue.")).toBeInTheDocument();
  });

  it("handles unexpected thrown values during import and lets the file picker button trigger the input", async () => {
    const inputClick = vi.spyOn(HTMLInputElement.prototype, "click").mockImplementation(() => {});
    fetchMock
      .mockResolvedValueOnce(new Response("format_version = 1\n", { status: 200 }))
      .mockRejectedValueOnce("upload crashed");

    render(<ContentExchangeManager apiBase="http://example.test" onRequestLogin={vi.fn()} />);

    await waitFor(() =>
      expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toContain(
        "format_version = 1",
      ),
    );

    fireEvent.click(screen.getByRole("button", { name: "Choisir un fichier" }));
    expect(inputClick).toHaveBeenCalled();

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["format_version = 1"], "import.toml", { type: "text/plain" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(await screen.findByText("Erreur inattendue.")).toBeInTheDocument();
  });

  it("reopens login when download or import returns 401", async () => {
    const onRequestLogin = vi.fn();
    fetchMock
      .mockResolvedValueOnce(new Response("format_version = 1\n", { status: 200 }))
      .mockResolvedValueOnce(new Response("", { status: 401 }))
      .mockResolvedValueOnce(new Response("", { status: 401 }));

    render(<ContentExchangeManager apiBase="http://example.test" onRequestLogin={onRequestLogin} />);

    await waitFor(() =>
      expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toContain(
        "format_version = 1",
      ),
    );

    fireEvent.click(screen.getByRole("button", { name: "Telecharger l'extraction" }));
    await waitFor(() => expect(onRequestLogin).toHaveBeenCalledTimes(1));

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["format_version = 1"], "import.toml", { type: "text/plain" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => expect(onRequestLogin).toHaveBeenCalledTimes(2));
  });

  it("requests login when no token is available", async () => {
    sessionStorage.removeItem("access_token");
    const onRequestLogin = vi.fn();

    render(<ContentExchangeManager apiBase="http://example.test" onRequestLogin={onRequestLogin} />);

    await waitFor(() => expect(onRequestLogin).toHaveBeenCalled());
    expect(
      screen.getByText("Connexion requise pour acceder au chargeur / extracteur."),
    ).toBeInTheDocument();
  });

  it("requests login when token disappears before download or import", async () => {
    const onRequestLogin = vi.fn();
    fetchMock.mockResolvedValueOnce(new Response("format_version = 1\n", { status: 200 }));

    render(<ContentExchangeManager apiBase="http://example.test" onRequestLogin={onRequestLogin} />);

    await waitFor(() =>
      expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toContain(
        "format_version = 1",
      ),
    );

    sessionStorage.removeItem("access_token");
    fireEvent.click(screen.getByRole("button", { name: "Telecharger l'extraction" }));
    expect(await screen.findByText("Connexion requise pour acceder au chargeur / extracteur.")).toBeInTheDocument();

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["format_version = 1"], "import.toml", { type: "text/plain" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => expect(onRequestLogin).toHaveBeenCalledTimes(2));
  });

  it("handles sessionStorage access failures", async () => {
    const onRequestLogin = vi.fn();
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    render(<ContentExchangeManager apiBase="http://example.test" onRequestLogin={onRequestLogin} />);

    await waitFor(() => expect(onRequestLogin).toHaveBeenCalled());
  });
});
