import { describe, expect, it, beforeEach, afterEach } from "vitest";

import { isAccessTokenValid, isBackofficeEnabled } from "./backoffice";

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
});

describe("isAccessTokenValid", () => {
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
});
