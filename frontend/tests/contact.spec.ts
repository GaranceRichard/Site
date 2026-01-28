import { expect, test } from "./fixtures";

test("contact form submits successfully", async ({ page }) => {
  await page.goto("/contact");

  await page.getByLabel("Nom").fill("E2E User");
  await page.getByLabel("Email").fill(`e2e-${Date.now()}@example.com`);
  await page.getByLabel("Sujet").fill("Demande E2E");
  await page.getByLabel("Message").fill("Bonjour, ceci est un test E2E.");
  await page.getByRole("checkbox").check();

  await page.getByRole("button", { name: "Envoyer" }).click();
  await expect(page.getByText("Merci, votre message a bien été envoyé.")).toBeVisible();
});

test("contact form shows error when consent is missing", async ({ page }) => {
  await page.goto("/contact");

  await page.getByLabel("Nom").fill("E2E User");
  await page.getByLabel("Email").fill(`e2e-${Date.now()}@example.com`);
  await page.getByLabel("Sujet").fill("Demande E2E");
  await page.getByLabel("Message").fill("Je n'ai pas coché le consentement.");

  await page.getByRole("button", { name: "Envoyer" }).click();
  await expect(page.getByText(/^Erreur :/)).toBeVisible();
});
