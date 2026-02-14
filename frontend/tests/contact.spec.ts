import { expect, test } from "./fixtures";
import { fillContactForm, submitContactForm } from "./helpers";

test("contact form submits successfully", async ({ page }) => {
  await page.goto("/contact");

  await fillContactForm(page, `${Date.now()}-ok`);
  await page.getByRole("checkbox").check();

  await submitContactForm(page);
  await expect(page.getByText(/Merci, votre message a bien.*envoy./i)).toBeVisible();
});

test("contact form shows error when consent is missing", async ({ page }) => {
  await page.goto("/contact");

  await fillContactForm(page, `${Date.now()}-no-consent`);
  await submitContactForm(page);

  await expect(page.getByText(/^Erreur :/)).toBeVisible();
});
