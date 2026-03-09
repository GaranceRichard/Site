import { expect, test } from "./fixtures";

const adminUser = process.env.E2E_ADMIN_USER;
const adminPass = process.env.E2E_ADMIN_PASS;
const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

type AdminTokens = {
  access: string;
  refresh: string;
};

let adminTokensPromise: Promise<AdminTokens> | null = null;

export function requireAdminCreds() {
  test.skip(!adminUser || !adminPass, "E2E_ADMIN_USER/E2E_ADMIN_PASS not set");
}

async function fetchAdminTokens(): Promise<AdminTokens> {
  requireAdminCreds();

  const response = await fetch(`${apiBase}/api/auth/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: adminUser,
      password: adminPass,
    }),
  });

  if (!response.ok) {
    throw new Error(`Unable to fetch admin tokens: ${response.status}`);
  }

  return (await response.json()) as AdminTokens;
}

async function getAdminTokens(): Promise<AdminTokens> {
  if (!adminTokensPromise) {
    adminTokensPromise = fetchAdminTokens();
  }

  return adminTokensPromise;
}

async function injectAdminSession(page: import("@playwright/test").Page) {
  const tokens = await getAdminTokens();

  await page.goto("/");
  await page.evaluate((auth) => {
    window.sessionStorage.setItem("access_token", auth.access);
    window.sessionStorage.setItem("refresh_token", auth.refresh);
  }, tokens);
}

export async function fillStableValue(
  locator: import("@playwright/test").Locator,
  value: string,
  attempts = 3,
) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    await locator.click();
    await locator.fill(value);

    try {
      await expect(locator).toHaveValue(value, { timeout: 1_500 });
      return;
    } catch {
      if (attempt === attempts - 1) {
        throw new Error(`Unable to persist value "${value}" in input`);
      }
      await locator.clear();
      await locator.page().waitForTimeout(150);
    }
  }
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
  await injectAdminSession(page);
  await page.goto("/backoffice");
  await expect(page.getByRole("heading", { name: "Backoffice" })).toBeVisible({ timeout: 12_000 });
}

export async function submitAdminLogin(page: import("@playwright/test").Page) {
  requireAdminCreds();

  await openBackofficeLogin(page);
  const usernameInput = page.getByPlaceholder("Identifiant");
  const passwordInput = page.getByPlaceholder("Mot de passe");

  await fillStableValue(usernameInput, adminUser as string);

  await fillStableValue(passwordInput, adminPass as string);

  await page.getByRole("button", { name: "Se connecter" }).click();

  await Promise.race([
    page.waitForURL(/\/backoffice$/, { timeout: 12_000 }),
    expect(page.getByText(/Identifiant ou mot de passe invalide/i)).toBeVisible({ timeout: 12_000 }),
    expect(page.getByText(/API introuvable/i)).toBeVisible({ timeout: 12_000 }),
  ]);
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
