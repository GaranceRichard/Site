import { describe, expect, it } from "vitest";

import { toProxiedMediaUrl } from "./media";

describe("toProxiedMediaUrl", () => {
  it("returns an empty string for empty values", () => {
    expect(toProxiedMediaUrl("")).toBe("");
    expect(toProxiedMediaUrl("   ")).toBe("");
    expect(toProxiedMediaUrl(undefined)).toBe("");
  });

  it("keeps non-media relative paths unchanged", () => {
    expect(toProxiedMediaUrl("/references/logo.webp")).toBe("/references/logo.webp");
    expect(toProxiedMediaUrl("https://cdn.example.com/icon.webp")).toBe(
      "https://cdn.example.com/icon.webp",
    );
  });

  it("proxies local media paths", () => {
    expect(toProxiedMediaUrl("/media/references/icon.webp")).toBe(
      "/api-proxy/media/references/icon.webp",
    );
  });

  it("proxies absolute backend media urls", () => {
    expect(toProxiedMediaUrl("http://127.0.0.1:8000/media/references/icon.webp")).toBe(
      "/api-proxy/media/references/icon.webp",
    );
    expect(
      toProxiedMediaUrl("https://example.test/media/references/thumbs/icon.webp?x=1"),
    ).toBe("/api-proxy/media/references/thumbs/icon.webp?x=1");
  });

  it("keeps malformed absolute urls unchanged", () => {
    expect(toProxiedMediaUrl("https://%")).toBe("https://%");
  });
});
