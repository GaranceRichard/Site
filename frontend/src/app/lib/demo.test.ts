import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { getBasePath, isDemoMode, toDemoAssetUrl, withBasePath } from "./demo";

describe("demo helpers", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("detects demo mode from env flag", () => {
    delete process.env.NEXT_PUBLIC_DEMO_MODE;
    expect(isDemoMode()).toBe(false);

    process.env.NEXT_PUBLIC_DEMO_MODE = "true";
    expect(isDemoMode()).toBe(true);

    process.env.NEXT_PUBLIC_DEMO_MODE = "off";
    expect(isDemoMode()).toBe(false);
  });

  it("normalizes base path values", () => {
    delete process.env.NEXT_PUBLIC_BASE_PATH;
    expect(getBasePath()).toBe("");

    process.env.NEXT_PUBLIC_BASE_PATH = "Site/";
    expect(getBasePath()).toBe("/Site");
  });

  it("prefixes root-relative asset paths with the base path", () => {
    process.env.NEXT_PUBLIC_BASE_PATH = "/Site/";

    expect(withBasePath("/brand/logo.png")).toBe("/Site/brand/logo.png");
    expect(withBasePath("/")).toBe("/Site");
    expect(withBasePath("https://example.test/logo.png")).toBe("https://example.test/logo.png");
  });

  it("maps backend media paths to demo media paths", () => {
    process.env.NEXT_PUBLIC_BASE_PATH = "/Site/";

    expect(toDemoAssetUrl("")).toBe("");
    expect(toDemoAssetUrl("/media/references/demo.webp")).toBe("/Site/demo-media/references/demo.webp");
    expect(toDemoAssetUrl("references/demo.webp")).toBe("/Site/demo-media/references/demo.webp");
    expect(toDemoAssetUrl("https://example.test/media/references/demo.webp?x=1")).toBe(
      "/Site/demo-media/references/demo.webp?x=1",
    );
    expect(toDemoAssetUrl("https://example.test/assets/logo.png")).toBe("https://example.test/assets/logo.png");
    expect(toDemoAssetUrl("https://[invalid-url")).toBe("https://[invalid-url");
    expect(toDemoAssetUrl("/brand/logo.png")).toBe("/Site/brand/logo.png");
  });
});
