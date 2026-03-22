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

  it("returns home when stored value is home", () => {
    window.localStorage.setItem(SECTION_KEY, "home");
    expect(getBackofficeSection()).toBe("home");
  });

  it("returns promise when stored value is promise", () => {
    window.localStorage.setItem(SECTION_KEY, "promise");
    expect(getBackofficeSection()).toBe("promise");
  });

  it("returns method when stored value is method", () => {
    window.localStorage.setItem(SECTION_KEY, "method");
    expect(getBackofficeSection()).toBe("method");
  });

  it("returns messages when stored value is messages", () => {
    window.localStorage.setItem(SECTION_KEY, "messages");
    expect(getBackofficeSection()).toBe("messages");
  });

  it("returns stats when stored value is stats", () => {
    window.localStorage.setItem(SECTION_KEY, "stats");
    expect(getBackofficeSection()).toBe("stats");
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

  it("ignores localStorage write errors and still notifies listeners", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeBackofficeSection(listener);
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("boom");
    });

    expect(() => setBackofficeSection("stats")).not.toThrow();
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    spy.mockRestore();
  });

  it("supports multiple listeners on write", () => {
    const first = vi.fn();
    const second = vi.fn();
    const unsubscribeFirst = subscribeBackofficeSection(first);
    const unsubscribeSecond = subscribeBackofficeSection(second);

    setBackofficeSection("references");

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);

    unsubscribeFirst();
    unsubscribeSecond();
  });

  it("allows writing without listeners", () => {
    expect(() => setBackofficeSection("messages")).not.toThrow();
    expect(window.localStorage.getItem(SECTION_KEY)).toBe("messages");
  });

  it("stops notifying a listener after unsubscribe", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeBackofficeSection(listener);

    unsubscribe();
    setBackofficeSection("home");

    expect(listener).not.toHaveBeenCalled();
  });

  it("returns messages on server snapshot", () => {
    expect(getBackofficeSectionServer()).toBe("messages");
  });

  it("returns messages when window is unavailable", () => {
    const originalWindow = globalThis.window;
    vi.stubGlobal("window", undefined);

    try {
      expect(getBackofficeSection()).toBe("messages");
    } finally {
      vi.stubGlobal("window", originalWindow);
    }
  });

  it("does nothing when writing section without window", () => {
    const originalWindow = globalThis.window;
    const listener = vi.fn();
    const unsubscribe = subscribeBackofficeSection(listener);
    vi.stubGlobal("window", undefined);

    try {
      expect(() => setBackofficeSection("home")).not.toThrow();
      expect(listener).not.toHaveBeenCalled();
    } finally {
      unsubscribe();
      vi.stubGlobal("window", originalWindow);
    }
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
