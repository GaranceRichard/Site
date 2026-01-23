import { expect, test } from "@playwright/test";

const adminUser = process.env.E2E_ADMIN_USER;
const adminPass = process.env.E2E_ADMIN_PASS;

test("backoffice login fails with invalid credentials", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Accès back-office" }).click();
  await page.getByPlaceholder("Identifiant").fill("invalid-user");
  await page.getByPlaceholder("Mot de passe").fill("wrong-pass");
  await page.getByRole("button", { name: "Se connecter" }).click();

  await expect(page.getByText("Identifiant ou mot de passe invalide.")).toBeVisible();
});

test("backoffice login succeeds and reaches admin page", async ({ page }) => {
  test.skip(!adminUser || !adminPass, "E2E_ADMIN_USER/E2E_ADMIN_PASS not set");

  await page.goto("/");

  await page.getByRole("button", { name: "Accès back-office" }).click();
  await page.getByPlaceholder("Identifiant").fill(adminUser as string);
  await page.getByPlaceholder("Mot de passe").fill(adminPass as string);
  await page.getByRole("button", { name: "Se connecter" }).click();

  await expect(page.getByRole("heading", { name: "Backoffice" })).toBeVisible();
});

test("backoffice logout clears session and returns home", async ({ page }) => {
  test.skip(!adminUser || !adminPass, "E2E_ADMIN_USER/E2E_ADMIN_PASS not set");

  await page.goto("/");

  await page.getByRole("button", { name: "Accès back-office" }).click();
  await page.getByPlaceholder("Identifiant").fill(adminUser as string);
  await page.getByPlaceholder("Mot de passe").fill(adminPass as string);
  await page.getByRole("button", { name: "Se connecter" }).click();

  await expect(page.getByRole("heading", { name: "Backoffice" })).toBeVisible();

  await page.getByRole("button", { name: "Se déconnecter" }).click();
  await expect(page).toHaveURL("/");
});
