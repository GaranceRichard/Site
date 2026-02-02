import { expect, test } from "./fixtures";

async function fillContactForm(page: import("@playwright/test").Page) {
  await page.getByLabel("Nom").fill("E2E Resilience");
  await page.getByLabel("Email").fill(`e2e-resilience-${Date.now()}@example.com`);
  await page.getByLabel("Sujet").fill("Resilience");
  await page.getByLabel("Message").fill("Test de robustesse réseau.");
  await page.getByRole("checkbox").check();
}

test("contact form shows an error on network failure", async ({ page }) => {
  await page.route("**/api/contact/messages", async (route) => {
    await route.abort("failed");
  });

  await page.goto("/contact");
  await fillContactForm(page);
  await page.getByRole("button", { name: "Envoyer" }).click();

  await expect(page.getByText(/^Erreur :/)).toBeVisible();
});

test("contact form shows timeout error when API is too slow", async ({ page }) => {
  await page.route("**/api/contact/messages", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 12_000));
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: "{}",
    });
  });

  await page.goto("/contact");
  await fillContactForm(page);
  await page.getByRole("button", { name: "Envoyer" }).click();

  await expect(
    page.getByText("Erreur : Délai dépassé. Veuillez réessayer.")
  ).toBeVisible({ timeout: 15_000 });
});
