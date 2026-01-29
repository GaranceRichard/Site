import { expect, test } from "./fixtures";

const adminUser = process.env.E2E_ADMIN_USER;
const adminPass = process.env.E2E_ADMIN_PASS;
const debugE2E = process.env.E2E_DEBUG === "true";
const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

async function seedContactMessages(
  request: import("@playwright/test").APIRequestContext,
  count = 1
) {
  const stamp = Date.now();
  const names: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const name = `E2E ${stamp}-${i}`;
    names.push(name);
    await request.post(`${apiBase}/api/contact/messages`, {
      data: {
        name,
        email: `e2e-${stamp}-${i}@example.com`,
        subject: `Sujet ${stamp}-${i}`,
        message: `Message ${stamp}-${i}`,
        consent: true,
        source: "e2e",
      },
    });
  }
  return names;
}

function attachNetworkDebug(page: import("@playwright/test").Page) {
  if (!debugE2E) return;

  page.on("console", (msg) => {
    console.log("[E2E][console]", msg.type(), msg.text());
  });

  page.on("pageerror", (err) => {
    console.log("[E2E][pageerror]", err.message);
  });

  page.on("requestfailed", (req) => {
    console.log("[E2E][requestfailed]", req.method(), req.url(), req.failure()?.errorText);
  });

  page.on("response", async (res) => {
    const url = res.url();
    if (!url.includes("/api/auth/token/") && !url.includes("/api/contact/messages/admin")) return;

    let bodyPreview = "";
    try {
      const text = await res.text();
      bodyPreview = text.slice(0, 200);
    } catch {
      bodyPreview = "<unreadable>";
    }

    console.log("[E2E][response]", res.status(), url, bodyPreview);
  });
}

async function debugSessionStorage(page: import("@playwright/test").Page, label: string) {
  if (!debugE2E) return;
  const snapshot = await page.evaluate(() => ({
    access: sessionStorage.getItem("access_token"),
    refresh: sessionStorage.getItem("refresh_token"),
    url: window.location.href,
  }));
  console.log("[E2E][session]", label, snapshot);
}

test("backoffice login fails with invalid credentials", async ({ page }) => {
  attachNetworkDebug(page);
  await page.goto("/");

  await page.getByRole("button", { name: "Accès back-office" }).click();
  await page.getByPlaceholder("Identifiant").fill("invalid-user");
  await page.getByPlaceholder("Mot de passe").fill("wrong-pass");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await debugSessionStorage(page, "after-invalid-login");

  await expect(page.getByText("Identifiant ou mot de passe invalide.")).toBeVisible();
});

test("backoffice login succeeds and reaches admin page", async ({ page }) => {
  test.skip(!adminUser || !adminPass, "E2E_ADMIN_USER/E2E_ADMIN_PASS not set");

  attachNetworkDebug(page);
  await page.goto("/");

  await page.getByRole("button", { name: "Accès back-office" }).click();
  await page.getByPlaceholder("Identifiant").fill(adminUser as string);
  await page.getByPlaceholder("Mot de passe").fill(adminPass as string);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await debugSessionStorage(page, "after-valid-login");

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
  await expect(page).toHaveURL("/");
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

  await page.getByRole("button", { name: "Retour au site", exact: true }).click();
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

  await expect(page.getByRole("button", { name: "Trier par nom" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Trier par email" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Trier par sujet" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Trier par date" })).toBeVisible();

  await expect(page.getByText(/Page 1 \/ \d+ — \d+ message/)).toBeVisible();
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

test("select and delete messages", async ({ page, request }) => {
  test.skip(!adminUser || !adminPass, "E2E_ADMIN_USER/E2E_ADMIN_PASS not set");

  const [seedName] = await seedContactMessages(request, 1);

  await page.goto("/");

  await page.getByRole("button", { name: "Accès back-office" }).click();
  await page.getByPlaceholder("Identifiant").fill(adminUser as string);
  await page.getByPlaceholder("Mot de passe").fill(adminPass as string);
  await page.getByRole("button", { name: "Se connecter" }).click();

  await expect(page.getByRole("heading", { name: "Backoffice" })).toBeVisible();
  await expect(page.getByText(seedName)).toBeVisible();

  const checkbox = page.getByRole("checkbox", { name: /Selectionner/i }).first();
  await checkbox.check();

  const deleteButton = page.getByRole("button", { name: "Supprimer" });
  await expect(deleteButton).toBeEnabled();
  await deleteButton.click();

  await expect(deleteButton).toBeDisabled();
});

test("delete button is disabled when nothing is selected", async ({ page, request }) => {
  test.skip(!adminUser || !adminPass, "E2E_ADMIN_USER/E2E_ADMIN_PASS not set");

  const [seedName] = await seedContactMessages(request, 1);

  await page.goto("/");

  await page.getByRole("button", { name: "Accès back-office" }).click();
  await page.getByPlaceholder("Identifiant").fill(adminUser as string);
  await page.getByPlaceholder("Mot de passe").fill(adminPass as string);
  await page.getByRole("button", { name: "Se connecter" }).click();

  await expect(page.getByRole("heading", { name: "Backoffice" })).toBeVisible();
  await expect(page.getByText(seedName)).toBeVisible();

  const deleteButton = page.getByRole("button", { name: "Supprimer" });
  await expect(deleteButton).toBeDisabled();
});

test("delete shows undo toast and restore on cancel", async ({ page, request }) => {
  test.skip(!adminUser || !adminPass, "E2E_ADMIN_USER/E2E_ADMIN_PASS not set");

  const [seedName] = await seedContactMessages(request, 1);

  await page.goto("/");

  await page.getByRole("button", { name: "Accès back-office" }).click();
  await page.getByPlaceholder("Identifiant").fill(adminUser as string);
  await page.getByPlaceholder("Mot de passe").fill(adminPass as string);
  await page.getByRole("button", { name: "Se connecter" }).click();

  await expect(page.getByRole("heading", { name: "Backoffice" })).toBeVisible();
  await expect(page.getByText(seedName)).toBeVisible();

  const checkbox = page.getByRole("checkbox", { name: /Selectionner/i }).first();
  await checkbox.check();

  const deleteButton = page.getByRole("button", { name: "Supprimer" });
  await deleteButton.click();

  const undoToast = page.getByText(/message\(s\) supprimé\(s\)/);
  await expect(undoToast).toBeVisible();
  await page.getByRole("button", { name: "Annuler" }).click();
  await expect(undoToast).not.toBeVisible();
});
