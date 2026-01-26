import { describe, expect, it, beforeEach, afterEach } from "vitest";

import { isBackofficeEnabled } from "./backoffice";

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
