import { expect, test } from "./fixtures";

const adminUser = process.env.E2E_ADMIN_USER;
const adminPass = process.env.E2E_ADMIN_PASS;

export function requireAdminCreds() {
  test.skip(!adminUser || !adminPass, "E2E_ADMIN_USER/E2E_ADMIN_PASS not set");
}

export async function openBackofficeLogin(page: import("@playwright/test").Page) {
  await page.goto("/");
  const loginButton = page.getByRole("button", { name: /Acc.s back-office/i });
  await loginButton.scrollIntoViewIfNeeded();
  await loginButton.click({ force: true });

  const usernameInput = page.getByPlaceholder("Identifiant");
  try {
    await expect(usernameInput).toBeVisible({ timeout: 8_000 });
  } catch {
    await loginButton.click({ force: true });
    await expect(usernameInput).toBeVisible({ timeout: 20_000 });
  }
}

export async function loginAsAdmin(page: import("@playwright/test").Page) {
  requireAdminCreds();

  for (let attempt = 0; attempt < 2; attempt += 1) {
    await openBackofficeLogin(page);
    await page.getByPlaceholder("Identifiant").fill(adminUser as string);
    await page.getByPlaceholder("Mot de passe").fill(adminPass as string);
    await page.getByRole("button", { name: "Se connecter" }).click();
    try {
      await expect(page.getByRole("heading", { name: "Backoffice" })).toBeVisible({ timeout: 12_000 });
      return;
    } catch {
      if (attempt === 1) {
        throw new Error("Unable to login to backoffice");
      }
    }
  }
}

export async function fillContactForm(page: import("@playwright/test").Page, seed: string) {
  await page.getByLabel("Nom").fill("E2E User");
  await page.getByLabel("Email").fill(`e2e-${seed}@example.com`);
  await page.getByLabel("Sujet").fill(`Demande E2E ${seed}`);
  await page.getByLabel("Message").fill(`Message E2E ${seed}`);
}

export async function submitContactForm(page: import("@playwright/test").Page) {
  const submit = page.getByRole("button", { name: /Envoyer|Envoi/i });
  await submit.scrollIntoViewIfNeeded();
  await submit.click({ force: true });
}
