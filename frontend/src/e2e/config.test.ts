import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  DEFAULT_E2E_BACKEND_PORT,
  DEFAULT_E2E_FRONTEND_PORT,
  getE2EBackendEnv,
  getE2EPaths,
  getE2EUrls,
} from "./config";

describe("E2E config isolation", () => {
  it("uses dedicated local ports by default", () => {
    const urls = getE2EUrls({});

    expect(urls.frontendPort).toBe(DEFAULT_E2E_FRONTEND_PORT);
    expect(urls.backendPort).toBe(DEFAULT_E2E_BACKEND_PORT);
    expect(urls.baseURL).toBe("http://127.0.0.1:3100");
    expect(urls.apiBaseURL).toBe("http://127.0.0.1:8100");
  });

  it("stores the Django database and media under the E2E sandbox", () => {
    const paths = getE2EPaths({});

    expect(paths.sandboxRoot).toContain(path.join("frontend", ".e2e-virtual"));
    expect(paths.djangoDatabasePath).toContain(path.join(".e2e-virtual", "backend", "db.sqlite3"));
    expect(paths.djangoMediaRoot).toContain(path.join(".e2e-virtual", "backend", "media"));
  });

  it("builds backend defaults that stay isolated from dev resources", () => {
    const env = getE2EBackendEnv({ E2E_FRONTEND_PORT: "3300" });

    expect(env.DJANGO_E2E_MODE).toBe("true");
    expect(env.DJANGO_ENABLE_JWT).toBe("true");
    expect(env.DJANGO_MEDIA_ROOT).toContain(path.join(".e2e-virtual", "backend", "media"));
    expect(env.DATABASE_URL).toContain(".e2e-virtual/backend/db.sqlite3");
    expect(env.DJANGO_CORS_ALLOWED_ORIGINS).toContain("http://127.0.0.1:3300");
    expect(env.DJANGO_CSRF_TRUSTED_ORIGINS).toContain("http://localhost:3300");
  });

  it("falls back to default ports when the provided values are invalid", () => {
    const urls = getE2EUrls({
      E2E_FRONTEND_PORT: "abc",
      E2E_BACKEND_PORT: "",
    });

    expect(urls.frontendPort).toBe(DEFAULT_E2E_FRONTEND_PORT);
    expect(urls.backendPort).toBe(DEFAULT_E2E_BACKEND_PORT);
  });

  it("ignores backend overrides that could escape the sandbox", () => {
    const env = getE2EBackendEnv({
      DATABASE_URL: " sqlite:///custom.sqlite3 ",
      DJANGO_MEDIA_ROOT: " custom-media ",
      DJANGO_ENABLE_JWT: " false ",
      DJANGO_E2E_MODE: " false ",
      DJANGO_CORS_ALLOWED_ORIGINS: " http://frontend.test ",
      DJANGO_CSRF_TRUSTED_ORIGINS: " http://csrf.test ",
    });

    expect(env.DATABASE_URL).toContain(".e2e-virtual/backend/db.sqlite3");
    expect(env.DJANGO_MEDIA_ROOT).toContain(path.join(".e2e-virtual", "backend", "media"));
    expect(env.DJANGO_ENABLE_JWT).toBe("true");
    expect(env.DJANGO_E2E_MODE).toBe("true");
    expect(env.DJANGO_CORS_ALLOWED_ORIGINS).toContain("http://127.0.0.1:3100");
    expect(env.DJANGO_CSRF_TRUSTED_ORIGINS).toContain("http://localhost:3100");
  });

  it("builds a relative sqlite URL when the sandbox path is relative", () => {
    const env = getE2EBackendEnv({
      E2E_SANDBOX_ROOT: "sandbox",
    });

    expect(env.DATABASE_URL).toBe("sqlite:///sandbox/backend/db.sqlite3");
  });

  it("ignores API overrides and keeps the dedicated E2E backend URL", () => {
    const urls = getE2EUrls({
      E2E_API_BASE_URL: "http://127.0.0.1:9100",
      NEXT_PUBLIC_API_BASE_URL: "http://127.0.0.1:8000",
    });

    expect(urls.apiBaseURL).toBe("http://127.0.0.1:8100");
  });

  it("refuses unsafe dev ports and falls back to isolated defaults", () => {
    const urls = getE2EUrls({
      E2E_FRONTEND_PORT: "3000",
      E2E_BACKEND_PORT: "8000",
    });

    expect(urls.baseURL).toBe("http://127.0.0.1:3100");
    expect(urls.apiBaseURL).toBe("http://127.0.0.1:8100");
  });
});
