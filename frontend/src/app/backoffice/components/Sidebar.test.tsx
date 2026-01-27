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
    fireEvent.click(screen.getByRole("button", { name: "Références" }));
    fireEvent.click(screen.getByRole("button", { name: "Retour au site" }));
    fireEvent.click(screen.getByRole("button", { name: "Rafraîchir" }));
    fireEvent.click(screen.getByRole("button", { name: "Se déconnecter" }));

    expect(onSelectSection).toHaveBeenCalledWith("messages");
    expect(onSelectSection).toHaveBeenCalledWith("references");
    expect(onGoHome).toHaveBeenCalled();
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
});
