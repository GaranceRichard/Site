import { describe, expect, it, vi } from "vitest";
import {
  getBackofficeSection,
  getBackofficeSectionServer,
  setBackofficeSection,
  subscribeBackofficeSection,
} from "./sectionStore";

const SECTION_KEY = "backoffice_section";

describe("sectionStore", () => {
  it("returns messages when localStorage is empty", () => {
    window.localStorage.removeItem(SECTION_KEY);
    expect(getBackofficeSection()).toBe("messages");
  });

  it("returns stored value when valid", () => {
    window.localStorage.setItem(SECTION_KEY, "references");
    expect(getBackofficeSection()).toBe("references");
  });

  it("returns header when stored value is header", () => {
    window.localStorage.setItem(SECTION_KEY, "header");
    expect(getBackofficeSection()).toBe("header");
  });

  it("falls back to messages when stored value is invalid", () => {
    window.localStorage.setItem(SECTION_KEY, "invalid");
    expect(getBackofficeSection()).toBe("messages");
  });

  it("writes to localStorage and notifies listeners", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeBackofficeSection(listener);
    setBackofficeSection("stats");
    expect(window.localStorage.getItem(SECTION_KEY)).toBe("stats");
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it("returns messages on server snapshot", () => {
    expect(getBackofficeSectionServer()).toBe("messages");
  });

  it("handles localStorage read errors gracefully", () => {
    const spy = vi
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new Error("boom");
      });
    expect(getBackofficeSection()).toBe("messages");
    spy.mockRestore();
  });
});
