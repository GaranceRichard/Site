import { fireEvent, render, screen, cleanup, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ThemeToggle from "./ThemeToggle";

describe("ThemeToggle", () => {
  const originalLocalStorage = window.localStorage;

  beforeEach(() => {
    document.documentElement.classList.remove("dark");
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
    document.documentElement.classList.remove("dark");
    Object.defineProperty(window, "localStorage", { value: originalLocalStorage });
  });

  it("shows night label when in light mode and toggles to dark", () => {
    render(<ThemeToggle />);

    const button = screen.getByRole("button", { name: "Passer en mode nuit" });
    fireEvent.click(button);

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(window.localStorage.getItem("theme")).toBe("dark");
  });

  it("shows day label when dark class is present", () => {
    document.documentElement.classList.add("dark");
    render(<ThemeToggle />);

    expect(screen.getByRole("button", { name: "Passer en mode jour" })).toBeInTheDocument();
  });

  it("applies a stored theme on mount", async () => {
    window.localStorage.setItem("theme", "dark");

    render(<ThemeToggle />);

    await waitFor(() => {
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });
  });

  it("reacts to a themechange event and supports a custom className", async () => {
    render(<ThemeToggle className="custom-theme-toggle" />);

    const button = screen.getByRole("button", { name: "Passer en mode nuit" });
    expect(button.className).toContain("custom-theme-toggle");

    document.documentElement.classList.add("dark");
    window.dispatchEvent(new Event("themechange"));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Passer en mode jour" })).toBeInTheDocument();
    });
  });

  it("still toggles when localStorage access fails", () => {
    const getSpy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("boom get");
    });
    const setSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("boom set");
    });

    render(<ThemeToggle />);

    fireEvent.click(screen.getByRole("button", { name: "Passer en mode nuit" }));

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    getSpy.mockRestore();
    setSpy.mockRestore();
  });
});
