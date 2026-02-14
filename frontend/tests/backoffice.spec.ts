import { expect, test } from "./fixtures";
import { loginAsAdmin, openBackofficeLogin, requireAdminCreds } from "./helpers";

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

test.describe.configure({ mode: "serial" });

async function seedContactMessages(
  request: import("@playwright/test").APIRequestContext,
  count = 1,
) {
  const stamp = Date.now();
  const names: string[] = [];
  const emails: string[] = [];
  const subjects: string[] = [];

  for (let i = 0; i < count; i += 1) {
    const name = `E2E ${stamp}-${i}`;
    const email = `e2e-${stamp}-${i}@example.com`;
    const subject = `Sujet ${stamp}-${i}`;
    names.push(name);
    emails.push(email);
    subjects.push(subject);

    await request.post(`${apiBase}/api/contact/messages`, {
      data: {
        name,
        email,
        subject,
        message: `Message ${stamp}-${i}`,
        consent: true,
        source: "e2e",
      },
    });
  }

  return { names, emails, subjects };
}

test("backoffice login fails with invalid credentials", async ({ page }) => {
  await openBackofficeLogin(page);
  await page.getByPlaceholder("Identifiant").fill("invalid-user");
  await page.getByPlaceholder("Mot de passe").fill("wrong-pass");
  await page.getByRole("button", { name: "Se connecter" }).click();

  await expect(page.getByText(/Identifiant ou mot de passe invalide/i)).toBeVisible();
});

test("backoffice login succeeds and reaches admin page", async ({ page }) => {
  requireAdminCreds();
  await loginAsAdmin(page);
  await expect(page.getByRole("heading", { name: "Backoffice" })).toBeVisible();
});

test("backoffice logout clears session and returns home", async ({ page }) => {
  requireAdminCreds();
  await loginAsAdmin(page);

  await page.getByRole("button", { name: /Se d.*connecter/i }).click();
  await expect(page).toHaveURL("/");
});

test("logout then visiting backoffice shows auth warning", async ({ page }) => {
  requireAdminCreds();
  await loginAsAdmin(page);

  await page.getByRole("button", { name: /Se d.*connecter/i }).click();
  await expect(page).toHaveURL("/");

  await page.goto("/backoffice");
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("button", { name: /Acc.s back-office/i })).toBeVisible();
});

test("expired token shows auth warning", async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem("access_token", "invalid-token");
  });

  await page.goto("/backoffice");
  await expect(page.getByText(/Session expir.*Reconnectez-vous\./)).toBeVisible();
  await expect(page.getByRole("button", { name: "Se reconnecter" })).toBeVisible();
});

test("return to site keeps session and footer icon reopens backoffice", async ({ page }) => {
  requireAdminCreds();
  await loginAsAdmin(page);

  await page.getByRole("button", { name: "Retour au site", exact: true }).click();
  await expect(page).toHaveURL("/");

  await page.getByRole("button", { name: /Back-office/i }).click();
  await expect(page).toHaveURL("/backoffice");
});

test("clicking a message opens details modal", async ({ page, request }) => {
  requireAdminCreds();

  const { names } = await seedContactMessages(request, 1);
  await loginAsAdmin(page);

  const seedCell = page.getByText(names[0], { exact: true });
  await expect(seedCell).toBeVisible();
  await seedCell.click();

  const modal = page.getByTestId("message-modal");
  await expect(modal).toBeVisible();
  await expect(modal.getByText("Nom :", { exact: true })).toBeVisible();
  await expect(modal.getByText("Email :", { exact: true })).toBeVisible();
  await expect(modal.getByText("Sujet :", { exact: true })).toBeVisible();
  await expect(modal.getByText("Message :", { exact: true })).toBeVisible();
});

test("messages list shows single-line columns and pagination", async ({ page, request }) => {
  requireAdminCreds();
  await seedContactMessages(request, 2);
  await loginAsAdmin(page);

  await expect(page.getByRole("button", { name: "Trier par nom" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Trier par email" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Trier par sujet" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Trier par date" })).toBeVisible();

  await expect(page.getByText(/Page 1 \/ \d+.*\d+ message/i)).toBeVisible();
});

test("search filters messages by name, email, or subject", async ({ page, request }) => {
  requireAdminCreds();
  const seeded = await seedContactMessages(request, 1);
  await loginAsAdmin(page);

  const search = page.getByPlaceholder("Rechercher par nom, email ou sujet");
  await expect(search).toBeVisible();

  await search.fill(seeded.emails[0]);
  await expect(page.getByText(seeded.names[0], { exact: true })).toBeVisible();

  await search.fill(seeded.subjects[0]);
  await expect(page.getByText(seeded.names[0], { exact: true })).toBeVisible();
});

test("select and delete messages", async ({ page, request }) => {
  requireAdminCreds();

  const { names } = await seedContactMessages(request, 1);
  await loginAsAdmin(page);
  await expect(page.getByText(names[0])).toBeVisible();

  const checkbox = page.getByRole("checkbox", { name: /S.lectionner/i }).first();
  await checkbox.check();

  const deleteButton = page.getByRole("button", { name: "Supprimer" });
  await expect(deleteButton).toBeEnabled();
  await deleteButton.click();
  await expect(deleteButton).toBeDisabled();
});

test("delete button is disabled when nothing is selected", async ({ page, request }) => {
  requireAdminCreds();

  const { names } = await seedContactMessages(request, 1);
  await loginAsAdmin(page);
  await expect(page.getByText(names[0])).toBeVisible();

  const deleteButton = page.getByRole("button", { name: "Supprimer" });
  await expect(deleteButton).toBeDisabled();
});

test("delete shows undo toast and restore on cancel", async ({ page, request }) => {
  requireAdminCreds();

  const { names } = await seedContactMessages(request, 1);
  await loginAsAdmin(page);
  await expect(page.getByText(names[0])).toBeVisible();

  const checkbox = page.getByRole("checkbox", { name: /S.lectionner/i }).first();
  await checkbox.check();

  const deleteButton = page.getByRole("button", { name: "Supprimer" });
  await deleteButton.click();

  const undoToast = page.getByText(/message\(s\) supprim/i);
  await expect(undoToast).toBeVisible();
  await page.getByRole("button", { name: "Annuler" }).click();
  await expect(undoToast).not.toBeVisible();
});
