import path from "node:path";
import { expect, test } from "./fixtures";

const adminUser = process.env.E2E_ADMIN_USER;
const adminPass = process.env.E2E_ADMIN_PASS;

async function loginBackoffice(page: import("@playwright/test").Page) {
  test.skip(!adminUser || !adminPass, "E2E_ADMIN_USER/E2E_ADMIN_PASS not set");

  await page.goto("/");
  await page.getByRole("button", { name: /back-office/i }).click();
  await page.getByPlaceholder("Identifiant").fill(adminUser as string);
  await page.getByPlaceholder("Mot de passe").fill(adminPass as string);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page.getByRole("heading", { name: "Backoffice" })).toBeVisible();
}

async function createReference(
  page: import("@playwright/test").Page,
  referenceName: string,
  situation?: string,
) {
  await page.getByRole("button", { name: "Références" }).click();
  await page.getByRole("button", { name: "Ajouter" }).click();
  await expect(page.getByText("Créer une référence")).toBeVisible();

  const [chooser] = await Promise.all([
    page.waitForEvent("filechooser"),
    page.getByRole("button", { name: "Charger l’image" }).click(),
  ]);

  const uploadPromise = page.waitForResponse((res) =>
    res.url().includes("/api/contact/references/admin/upload"),
  );

  const filePath = path.join(process.cwd(), "public", "brand", "logo.png");
  await chooser.setFiles(filePath);

  const uploadRes = await uploadPromise;
  expect(uploadRes.status(), "Upload image failed").toBeGreaterThanOrEqual(200);
  expect(uploadRes.status(), "Upload image failed").toBeLessThan(300);

  await page.getByLabel("Référence").fill(referenceName);
  if (situation !== undefined) {
    await page.getByLabel("Situation").fill(situation);
  }

  await expect(page.getByText("Aucune image")).toHaveCount(0);
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText("Créer une référence")).toBeHidden();
  await expect(page.getByText(referenceName)).toBeVisible();
}

async function deleteReference(page: import("@playwright/test").Page, referenceName: string) {
  await page.getByRole("checkbox", { name: `Sélectionner ${referenceName}` }).check();
  await page.getByRole("button", { name: "Supprimer" }).click();
  await expect(page.getByText(referenceName, { exact: true })).toHaveCount(0);
}

test("backoffice references create and delete", async ({ page }) => {
  await loginBackoffice(page);

  const referenceName = `Ref E2E ${Date.now()}`;
  await createReference(page, referenceName, "Situation E2E");
  await deleteReference(page, referenceName);
});

test("frontoffice reference modal shows details", async ({ page }) => {
  await loginBackoffice(page);

  const referenceName = `Ref Front ${Date.now()}`;
  const situation = "Situation front E2E";
  await createReference(page, referenceName, situation);

  await page.goto("/");
  const section = page.locator("section#references");
  await section.scrollIntoViewIfNeeded();

  await page.getByRole("button", { name: `Ouvrir la mission : ${referenceName}` }).click();
  const modal = page.getByRole("dialog", { name: `Détail de mission — ${referenceName}` });
  await expect(modal).toBeVisible();
  await expect(modal.getByText("Situation", { exact: true })).toBeVisible();
  await expect(modal.getByText(situation)).toBeVisible();

  await page.goto("/backoffice");
  await page.getByRole("button", { name: "Références" }).click();
  await deleteReference(page, referenceName);
});
