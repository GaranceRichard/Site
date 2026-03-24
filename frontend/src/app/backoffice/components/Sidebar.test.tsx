import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import Sidebar from "./Sidebar";

vi.mock("../../components/ThemeToggle", () => ({
  default: () => <button type="button">Theme</button>,
}));

afterEach(() => {
  cleanup();
});

describe("Sidebar", () => {
  it("appelle les handlers principaux", () => {
    const onSelectSection = vi.fn();
    const onGoHome = vi.fn();
    const onRefresh = vi.fn();
    const onLogout = vi.fn();

    render(
      <Sidebar
        section="messages"
        onSelectSection={onSelectSection}
        onGoHome={onGoHome}
        onRefresh={onRefresh}
        onLogout={onLogout}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Messages contact" }));
    fireEvent.click(screen.getByRole("button", { name: "Accueil" }));
    fireEvent.click(screen.getByRole("button", { name: "A propos" }));
    fireEvent.click(screen.getByRole("button", { name: "Positionnement" }));
    fireEvent.click(screen.getByRole("button", { name: "Approche" }));
    fireEvent.click(screen.getByRole("button", { name: "Publications" }));
    fireEvent.click(screen.getByRole("button", { name: "References" }));
    fireEvent.click(screen.getByRole("button", { name: "Statistiques" }));
    fireEvent.click(screen.getByRole("button", { name: "Header" }));
    fireEvent.click(screen.getByRole("button", { name: "Retour au site (logo)" }));
    fireEvent.click(screen.getByRole("button", { name: "Retour au site" }));
    fireEvent.click(screen.getByRole("button", { name: "Rafraîchir" }));
    fireEvent.click(screen.getByRole("button", { name: "Se déconnecter" }));

    expect(onSelectSection).toHaveBeenCalledWith("messages");
    expect(onSelectSection).toHaveBeenCalledWith("home");
    expect(onSelectSection).toHaveBeenCalledWith("about");
    expect(onSelectSection).toHaveBeenCalledWith("promise");
    expect(onSelectSection).toHaveBeenCalledWith("method");
    expect(onSelectSection).toHaveBeenCalledWith("publications");
    expect(onSelectSection).toHaveBeenCalledWith("references");
    expect(onSelectSection).toHaveBeenCalledWith("stats");
    expect(onSelectSection).toHaveBeenCalledWith("header");
    expect(onGoHome).toHaveBeenCalledTimes(2);
    expect(onRefresh).toHaveBeenCalled();
    expect(onLogout).toHaveBeenCalled();
  });

  it("affiche le style inactif quand la section n'est pas messages", () => {
    render(
      <Sidebar
        section="stats"
        onSelectSection={vi.fn()}
        onGoHome={vi.fn()}
        onRefresh={vi.fn()}
        onLogout={vi.fn()}
      />
    );

    const button = screen.getByRole("button", { name: "Messages contact" });
    expect(button.className).toContain("border border-neutral-200");
  });

  it("affiche le style actif pour Header", () => {
    render(
      <Sidebar
        section="header"
        onSelectSection={vi.fn()}
        onGoHome={vi.fn()}
        onRefresh={vi.fn()}
        onLogout={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "Header" }).className).toContain("bg-neutral-900 text-white");
  });

  it("affiche le style actif pour Accueil", () => {
    render(
      <Sidebar
        section="home"
        onSelectSection={vi.fn()}
        onGoHome={vi.fn()}
        onRefresh={vi.fn()}
        onLogout={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "Accueil" }).className).toContain("bg-neutral-900 text-white");
  });

  it("affiche le style actif pour Positionnement", () => {
    render(
      <Sidebar
        section="promise"
        onSelectSection={vi.fn()}
        onGoHome={vi.fn()}
        onRefresh={vi.fn()}
        onLogout={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "Positionnement" }).className).toContain("bg-neutral-900 text-white");
  });

  it("affiche le style actif pour A propos", () => {
    render(
      <Sidebar
        section="about"
        onSelectSection={vi.fn()}
        onGoHome={vi.fn()}
        onRefresh={vi.fn()}
        onLogout={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "A propos" }).className).toContain(
      "bg-neutral-900 text-white",
    );
  });

  it("affiche le style actif pour Approche", () => {
    render(
      <Sidebar
        section="method"
        onSelectSection={vi.fn()}
        onGoHome={vi.fn()}
        onRefresh={vi.fn()}
        onLogout={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "Approche" }).className).toContain("bg-neutral-900 text-white");
  });

  it("affiche le style actif pour References", () => {
    render(
      <Sidebar
        section="references"
        onSelectSection={vi.fn()}
        onGoHome={vi.fn()}
        onRefresh={vi.fn()}
        onLogout={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "References" }).className).toContain("bg-neutral-900 text-white");
  });

  it("affiche le style actif pour Statistiques", () => {
    render(
      <Sidebar
        section="stats"
        onSelectSection={vi.fn()}
        onGoHome={vi.fn()}
        onRefresh={vi.fn()}
        onLogout={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "Statistiques" }).className).toContain("bg-neutral-900 text-white");
  });
});
