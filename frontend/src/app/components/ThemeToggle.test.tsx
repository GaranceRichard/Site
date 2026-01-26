import { fireEvent, render, screen, cleanup } from "@testing-library/react";
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
});
