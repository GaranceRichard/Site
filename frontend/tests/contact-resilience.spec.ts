import { expect, test } from "./fixtures";
import { acceptContactConsent, fillContactForm, submitContactForm } from "./helpers";

test("contact form shows an error on network failure @coverage", async ({ page }) => {
  await page.route("**/api/contact/messages", async (route) => {
    await route.abort("failed");
  });

  await page.goto("/contact");
  await fillContactForm(page, `${Date.now()}-network-failure`);
  await acceptContactConsent(page);
  await submitContactForm(page);

  await expect(page.getByText(/^Erreur :/)).toBeVisible();
});

test("contact form shows timeout error when API is too slow @coverage", async ({ page }) => {
  await page.route("**/api/contact/messages", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 12_500));
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: "{}",
    });
  });

  await page.goto("/contact");
  await fillContactForm(page, `${Date.now()}-timeout`);
  await acceptContactConsent(page);
  await submitContactForm(page);

  await expect(page.getByText(/^Erreur :/)).toBeVisible({ timeout: 20_000 });
});

test("contact form falls back to plain text API errors @coverage", async ({ page }) => {
  await page.route("**/api/contact/messages", async (route) => {
    await route.fulfill({
      status: 500,
      contentType: "text/plain",
      body: "Server exploded",
    });
  });

  await page.goto("/contact");
  await fillContactForm(page, `${Date.now()}-plain-text`);
  await acceptContactConsent(page);
  await submitContactForm(page);

  await expect(page.getByText(/^Erreur :/)).toBeVisible();
});

test("contact form renders JSON API errors @coverage", async ({ page }) => {
  await page.route("**/api/contact/messages", async (route) => {
    await route.fulfill({
      status: 400,
      contentType: "application/json",
      body: JSON.stringify({ detail: "Validation ratee" }),
    });
  });

  await page.goto("/contact");
  await fillContactForm(page, `${Date.now()}-json-error`);
  await acceptContactConsent(page);
  await submitContactForm(page);

  await expect(page.getByText(/Validation ratee/)).toBeVisible();
});

test("contact form falls back to status code when API error body is empty @coverage", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (...args) => {
      const [input] = args;
      const url = typeof input === "string" ? input : input instanceof Request ? input.url : String(input);
      if (url.includes("/api/contact/messages")) {
        return {
          ok: false,
          status: 502,
          async json() {
            throw new Error("invalid json");
          },
          async text() {
            return "";
          },
        } as Response;
      }
      return originalFetch(...args);
    };
  });

  await page.goto("/contact");
  await fillContactForm(page, `${Date.now()}-empty-error`);
  await acceptContactConsent(page);
  await submitContactForm(page);

  await expect(page.getByText(/Erreur API \(502\)/)).toBeVisible();
});

test("contact form shows a generic message for non-Error throws @coverage", async ({ page }) => {
  await page.addInitScript(() => {
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (...args) => {
      const [input] = args;
      const url = typeof input === "string" ? input : input instanceof Request ? input.url : String(input);
      if (url.includes("/api/contact/messages")) {
        throw "boom";
      }
      return originalFetch(...args);
    };
  });

  await page.goto("/contact");
  await fillContactForm(page, `${Date.now()}-unknown-error`);
  await acceptContactConsent(page);
  await submitContactForm(page);

  await expect(page.getByText(/Erreur inattendue/)).toBeVisible();
});
