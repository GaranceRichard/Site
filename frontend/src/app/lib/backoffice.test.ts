import { describe, expect, it, beforeEach, afterEach } from "vitest";

import { isAccessTokenValid, isBackofficeEnabled, resolveApiBaseUrl } from "./backoffice";

const originalLocation = window.location;

describe("isBackofficeEnabled", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("defaults to true when env is missing", () => {
    delete process.env.NEXT_PUBLIC_BACKOFFICE_ENABLED;
    expect(isBackofficeEnabled()).toBe(true);
  });

  it("treats falsey string values as disabled", () => {
    process.env.NEXT_PUBLIC_BACKOFFICE_ENABLED = "false";
    expect(isBackofficeEnabled()).toBe(false);

    process.env.NEXT_PUBLIC_BACKOFFICE_ENABLED = "0";
    expect(isBackofficeEnabled()).toBe(false);

    process.env.NEXT_PUBLIC_BACKOFFICE_ENABLED = "off";
    expect(isBackofficeEnabled()).toBe(false);
  });

  it("treats other values as enabled", () => {
    process.env.NEXT_PUBLIC_BACKOFFICE_ENABLED = "true";
    expect(isBackofficeEnabled()).toBe(true);

    process.env.NEXT_PUBLIC_BACKOFFICE_ENABLED = "yes";
    expect(isBackofficeEnabled()).toBe(true);
  });

  it("treats blank values as enabled after trimming", () => {
    process.env.NEXT_PUBLIC_BACKOFFICE_ENABLED = "   ";
    expect(isBackofficeEnabled()).toBe(true);
  });

  it("always disables backoffice in demo mode", () => {
    process.env.NEXT_PUBLIC_DEMO_MODE = "true";
    process.env.NEXT_PUBLIC_BACKOFFICE_ENABLED = "true";
    expect(isBackofficeEnabled()).toBe(false);
  });
});

describe("isAccessTokenValid", () => {
  const originalAtob = globalThis.atob;

  afterEach(() => {
    globalThis.atob = originalAtob;
  });

  const base64Url = (input: string) =>
    Buffer.from(input, "utf-8")
      .toString("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

  const buildToken = (payload: Record<string, unknown>) => {
    const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const body = base64Url(JSON.stringify(payload));
    return `${header}.${body}.sig`;
  };

  it("returns false for empty or malformed tokens", () => {
    expect(isAccessTokenValid(null)).toBe(false);
    expect(isAccessTokenValid("")).toBe(false);
    expect(isAccessTokenValid("nope")).toBe(false);
    expect(isAccessTokenValid("a.b")).toBe(false);
  });

  it("treats tokens without exp as valid", () => {
    const token = buildToken({ sub: "user" });
    expect(isAccessTokenValid(token)).toBe(true);
  });

  it("returns false when exp is in the past", () => {
    const token = buildToken({ exp: Math.floor(Date.now() / 1000) - 60 });
    expect(isAccessTokenValid(token)).toBe(false);
  });

  it("returns true when exp is in the future", () => {
    const token = buildToken({ exp: Math.floor(Date.now() / 1000) + 3600 });
    expect(isAccessTokenValid(token)).toBe(true);
  });

  it("supports environments without atob via Buffer fallback", () => {
    // @ts-expect-error override for test
    globalThis.atob = undefined;
    const token = buildToken({ exp: Math.floor(Date.now() / 1000) + 60 });
    expect(isAccessTokenValid(token)).toBe(true);
  });

  it("returns true when exp is present but not numeric", () => {
    const token = buildToken({ exp: "tomorrow" });
    expect(isAccessTokenValid(token)).toBe(true);
  });

  it("returns false when payload decoding fails", () => {
    globalThis.atob = () => {
      throw new Error("bad base64");
    };

    expect(isAccessTokenValid("header.payload.signature")).toBe(false);
  });

  it("returns false when payload json is invalid", () => {
    globalThis.atob = () => "{not-json";

    expect(isAccessTokenValid("header.payload.signature")).toBe(false);
  });
});

describe("resolveApiBaseUrl", () => {
  const originalEnv = process.env;
  const originalWindow = globalThis.window;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    if (typeof window !== "undefined") {
      Object.defineProperty(window, "location", {
        configurable: true,
        value: originalLocation,
      });
    }
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: originalWindow,
    });
  });

  it("returns proxy path in the browser when env is configured", () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "http://example.test/";
    expect(resolveApiBaseUrl()).toBe("/api-proxy");
  });

  it("returns proxy path in the browser when env is missing", () => {
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    expect(resolveApiBaseUrl()).toBe("/api-proxy");
  });

  it("returns undefined in demo mode", () => {
    process.env.NEXT_PUBLIC_DEMO_MODE = "true";
    expect(resolveApiBaseUrl()).toBeUndefined();
  });

  it("uses the trimmed env value on the server", () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = " http://example.test/// ";
    // @ts-expect-error test server branch
    delete globalThis.window;

    expect(resolveApiBaseUrl()).toBe("http://example.test");
  });

  it("falls back to local Django on the server when env is missing", () => {
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    // @ts-expect-error test server branch
    delete globalThis.window;

    expect(resolveApiBaseUrl()).toBe("http://127.0.0.1:8000");
  });

  it("falls back to local Django on the server when env is blank", () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "   ";
    // @ts-expect-error test server branch
    delete globalThis.window;

    expect(resolveApiBaseUrl()).toBe("http://127.0.0.1:8000");
  });
});
