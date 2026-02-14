import { expect, test } from "./fixtures";
import { fillContactForm, submitContactForm } from "./helpers";

test("contact form shows an error on network failure", async ({ page }) => {
  await page.route("**/api/contact/messages", async (route) => {
    await route.abort("failed");
  });

  await page.goto("/contact");
  await fillContactForm(page, `${Date.now()}-network-failure`);
  await page.getByRole("checkbox").check();
  await submitContactForm(page);

  await expect(page.getByText(/^Erreur :/)).toBeVisible();
});

test("contact form shows timeout error when API is too slow", async ({ page }) => {
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
  await page.getByRole("checkbox").check();
  await submitContactForm(page);

  await expect(page.getByText(/^Erreur :/)).toBeVisible({ timeout: 20_000 });
});
