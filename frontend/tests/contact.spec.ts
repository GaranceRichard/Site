import { expect, test } from "./fixtures";
import { acceptContactConsent, fillContactForm, submitContactForm } from "./helpers";

async function submitContactFormWithRetry(page: import("@playwright/test").Page) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const responsePromise = page.waitForResponse((response) => {
      return (
        response.url().includes("/api/contact/messages") &&
        response.request().method() === "POST"
      );
    });

    await submitContactForm(page);
    const response = await responsePromise;

    if (response.ok()) {
      return;
    }

    if (attempt === 1) {
      return;
    }

    await page.waitForTimeout(11_000);
  }
}

test("contact form submits successfully @coverage @smoke", async ({ page }) => {
  await page.goto("/contact");

  await fillContactForm(page, `${Date.now()}-ok`);
  await acceptContactConsent(page);

  await submitContactFormWithRetry(page);
  await expect(page.getByText(/Merci, votre message a bien.*envoy./i)).toBeVisible();
});

test("contact form shows error when consent is missing @coverage", async ({ page }) => {
  await page.goto("/contact");

  await fillContactForm(page, `${Date.now()}-no-consent`);
  await submitContactForm(page);

  await expect(page.getByText(/^Erreur :/)).toBeVisible();
});

test("contact form honeypot short-circuits submission @coverage", async ({ page }) => {
  await page.goto("/contact");

  await fillContactForm(page, `${Date.now()}-honeypot`);
  await acceptContactConsent(page);
  await page.getByLabel("Website").fill("bot");
  await submitContactForm(page);

  await expect(page.getByText(/Merci, votre message a bien.*envoy./i)).toBeVisible();
});
