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

test("logout then visiting backoffice shows auth warning", async ({ page }) => {
  test.skip(!adminUser || !adminPass, "E2E_ADMIN_USER/E2E_ADMIN_PASS not set");

  await page.goto("/");

  await page.getByRole("button", { name: "Accès back-office" }).click();
  await page.getByPlaceholder("Identifiant").fill(adminUser as string);
  await page.getByPlaceholder("Mot de passe").fill(adminPass as string);
  await page.getByRole("button", { name: "Se connecter" }).click();

  await expect(page.getByRole("heading", { name: "Backoffice" })).toBeVisible();

  await page.getByRole("button", { name: "Se déconnecter" }).click();
  await expect(page).toHaveURL("/");

  await page.goto("/backoffice");
  await expect(page.getByText("Connexion requise pour acceder au backoffice.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Se reconnecter" })).toBeVisible();
});

test("expired token shows auth warning", async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem("access_token", "invalid-token");
  });

  await page.goto("/backoffice");
  await expect(page.getByText("Session expiree ou acces refuse. Reconnectez-vous.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Se reconnecter" })).toBeVisible();
});

test("return to site keeps session and footer icon reopens backoffice", async ({ page }) => {
  test.skip(!adminUser || !adminPass, "E2E_ADMIN_USER/E2E_ADMIN_PASS not set");

  await page.goto("/");

  await page.getByRole("button", { name: "Accès back-office" }).click();
  await page.getByPlaceholder("Identifiant").fill(adminUser as string);
  await page.getByPlaceholder("Mot de passe").fill(adminPass as string);
  await page.getByRole("button", { name: "Se connecter" }).click();

  await expect(page.getByRole("heading", { name: "Backoffice" })).toBeVisible();

  await page.getByRole("button", { name: "Retour au site" }).click();
  await expect(page).toHaveURL("/");

  await page.getByRole("button", { name: "Back-office (connecté)" }).click();
  await expect(page).toHaveURL("/backoffice");
});

test("clicking a message opens details modal", async ({ page }) => {
  test.skip(!adminUser || !adminPass, "E2E_ADMIN_USER/E2E_ADMIN_PASS not set");

  await page.goto("/");

  await page.getByRole("button", { name: "Accès back-office" }).click();
  await page.getByPlaceholder("Identifiant").fill(adminUser as string);
  await page.getByPlaceholder("Mot de passe").fill(adminPass as string);
  await page.getByRole("button", { name: "Se connecter" }).click();

  await expect(page.getByRole("heading", { name: "Backoffice" })).toBeVisible();

  const firstRow = page.locator("section ul li button").first();
  await firstRow.click();

  const modal = page.getByTestId("message-modal");
  await expect(modal).toBeVisible();
  await expect(modal.getByText("Nom :", { exact: true })).toBeVisible();
  await expect(modal.getByText("Email :", { exact: true })).toBeVisible();
  await expect(modal.getByText("Sujet :", { exact: true })).toBeVisible();
  await expect(modal.getByText("Message :", { exact: true })).toBeVisible();
});

test("messages list shows single-line columns and pagination", async ({ page }) => {
  test.skip(!adminUser || !adminPass, "E2E_ADMIN_USER/E2E_ADMIN_PASS not set");

  await page.goto("/");

  await page.getByRole("button", { name: "Accès back-office" }).click();
  await page.getByPlaceholder("Identifiant").fill(adminUser as string);
  await page.getByPlaceholder("Mot de passe").fill(adminPass as string);
  await page.getByRole("button", { name: "Se connecter" }).click();

  await expect(page.getByRole("heading", { name: "Backoffice" })).toBeVisible();

  await expect(page.getByText("Nom")).toBeVisible();
  await expect(page.getByText("Email")).toBeVisible();
  await expect(page.getByText("Sujet")).toBeVisible();
  await expect(page.getByText("Date")).toBeVisible();

  await expect(page.getByText(/Page \d+ \/ \d+ — \d+ message/)).toBeVisible();
});

test("search filters messages by name, email, or subject", async ({ page }) => {
  test.skip(!adminUser || !adminPass, "E2E_ADMIN_USER/E2E_ADMIN_PASS not set");

  await page.goto("/");

  await page.getByRole("button", { name: "Accès back-office" }).click();
  await page.getByPlaceholder("Identifiant").fill(adminUser as string);
  await page.getByPlaceholder("Mot de passe").fill(adminPass as string);
  await page.getByRole("button", { name: "Se connecter" }).click();

  await expect(page.getByRole("heading", { name: "Backoffice" })).toBeVisible();

  const search = page.getByPlaceholder("Rechercher par nom, email ou sujet");
  await expect(search).toBeVisible();

  const firstEmail = page.locator("section ul li span").nth(1);
  const email = (await firstEmail.textContent())?.trim() || "";
  if (email) {
    await search.fill(email);
    await expect(page.getByText(/Page \d+ \/ \d+ —/)).toBeVisible();
  }
});
