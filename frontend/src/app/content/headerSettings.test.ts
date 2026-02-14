import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_HEADER_SETTINGS,
  getHeaderSettings,
  getHeaderSettingsServer,
  setHeaderSettings,
  subscribeHeaderSettings,
} from "./headerSettings";

const HEADER_SETTINGS_KEY = "site_header_settings";

describe("headerSettings", () => {
  it("returns defaults when localStorage is empty", () => {
    window.localStorage.removeItem(HEADER_SETTINGS_KEY);
    expect(getHeaderSettings()).toEqual(DEFAULT_HEADER_SETTINGS);
  });

  it("returns stored value when valid", () => {
    window.localStorage.setItem(
      HEADER_SETTINGS_KEY,
      JSON.stringify({
        name: "Jane Doe",
        title: "Agile Coach",
        bookingUrl: "https://example.com/book",
      }),
    );

    expect(getHeaderSettings()).toEqual({
      name: "Jane Doe",
      title: "Agile Coach",
      bookingUrl: "https://example.com/book",
    });
  });

  it("falls back to defaults when stored value is invalid", () => {
    window.localStorage.setItem(HEADER_SETTINGS_KEY, "invalid-json");
    expect(getHeaderSettings()).toEqual(DEFAULT_HEADER_SETTINGS);
  });

  it("falls back to defaults when stored value is not an object", () => {
    window.localStorage.setItem(HEADER_SETTINGS_KEY, JSON.stringify("not-an-object"));
    expect(getHeaderSettings()).toEqual(DEFAULT_HEADER_SETTINGS);
  });

  it("normalizes invalid or blank fields from storage", () => {
    window.localStorage.setItem(
      HEADER_SETTINGS_KEY,
      JSON.stringify({
        name: "   ",
        title: 42,
        bookingUrl: " https://example.com/clean ",
      }),
    );

    expect(getHeaderSettings()).toEqual({
      name: DEFAULT_HEADER_SETTINGS.name,
      title: DEFAULT_HEADER_SETTINGS.title,
      bookingUrl: "https://example.com/clean",
    });
  });

  it("falls back to defaults when fields are non-strings", () => {
    window.localStorage.setItem(
      HEADER_SETTINGS_KEY,
      JSON.stringify({
        name: 123,
        title: null,
        bookingUrl: 456,
      }),
    );

    expect(getHeaderSettings()).toEqual(DEFAULT_HEADER_SETTINGS);
  });

  it("falls back to default bookingUrl when trimmed value is empty", () => {
    window.localStorage.setItem(
      HEADER_SETTINGS_KEY,
      JSON.stringify({
        name: "Jane",
        title: "Coach",
        bookingUrl: "   ",
      }),
    );

    expect(getHeaderSettings()).toEqual({
      name: "Jane",
      title: "Coach",
      bookingUrl: DEFAULT_HEADER_SETTINGS.bookingUrl,
    });
  });

  it("writes to localStorage and notifies listeners", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeHeaderSettings(listener);

    setHeaderSettings({
      name: "John Doe",
      title: "Lean Coach",
      bookingUrl: "https://example.com/rdv",
    });

    expect(window.localStorage.getItem(HEADER_SETTINGS_KEY)).toBe(
      JSON.stringify({
        name: "John Doe",
        title: "Lean Coach",
        bookingUrl: "https://example.com/rdv",
      }),
    );
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it("returns defaults on server snapshot", () => {
    expect(getHeaderSettingsServer()).toEqual(DEFAULT_HEADER_SETTINGS);
  });

  it("returns defaults when window is unavailable", () => {
    const originalWindow = (globalThis as { window?: Window }).window;
    vi.stubGlobal("window", undefined);

    expect(getHeaderSettings()).toEqual(DEFAULT_HEADER_SETTINGS);
    setHeaderSettings({
      name: "No Window",
      title: "No Window Title",
      bookingUrl: "https://example.com/no-window",
    });

    vi.stubGlobal("window", originalWindow);
  });

  it("handles localStorage write errors gracefully", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeHeaderSettings(listener);
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("write failed");
    });

    expect(() =>
      setHeaderSettings({
        name: "Write Error",
        title: "Write Error Title",
        bookingUrl: "https://example.com/write-error",
      }),
    ).not.toThrow();
    expect(listener).toHaveBeenCalledTimes(1);

    spy.mockRestore();
    unsubscribe();
  });
});
