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
