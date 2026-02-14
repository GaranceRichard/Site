import path from "node:path";
import { expect, test } from "./fixtures";
import { loginAsAdmin, requireAdminCreds } from "./helpers";

test.describe.configure({ mode: "serial" });

async function openReferencesManager(page: import("@playwright/test").Page) {
  await page.goto("/backoffice");
  await page.getByRole("button", { name: /R.f.rences/i }).click();
  await expect(page.getByRole("button", { name: "Ajouter" })).toBeVisible();
}

async function uploadWithChooser(
  page: import("@playwright/test").Page,
  buttonName: RegExp,
  filePath: string,
) {
  const uploadPromise = page.waitForResponse(
    (res) =>
      res.url().includes("/api/contact/references/admin/upload") &&
      res.request().method() === "POST" &&
      res.status() < 500,
    { timeout: 60_000 },
  );

  const [chooser] = await Promise.all([
    page.waitForEvent("filechooser"),
    page.getByRole("button", { name: buttonName }).click(),
  ]);

  await chooser.setFiles(filePath);
  const uploadRes = await uploadPromise;
  expect(uploadRes.ok()).toBeTruthy();
}

async function createReference(
  page: import("@playwright/test").Page,
  referenceName: string,
  situation?: string,
) {
  await openReferencesManager(page);
  await page.getByRole("button", { name: "Ajouter" }).click();
  await expect(page.getByText(/Cr.er une r.f.rence/i)).toBeVisible();

  const filePath = path.join(process.cwd(), "public", "brand", "logo.png");
  await uploadWithChooser(page, /Charger l.?image/i, filePath);

  await page.getByLabel(/R.f.rence/i).fill(referenceName);
  if (situation !== undefined) {
    await page.getByLabel("Situation").fill(situation);
  }

  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText(referenceName)).toBeVisible({ timeout: 20_000 });
}

async function deleteReference(page: import("@playwright/test").Page, referenceName: string) {
  await page.getByRole("checkbox", { name: new RegExp(`S.lectionner ${referenceName}`) }).check();
  await page.getByRole("button", { name: "Supprimer" }).click();
  await expect(page.getByText(referenceName, { exact: true })).toHaveCount(0);
}

async function deleteAllReferences(page: import("@playwright/test").Page) {
  for (let i = 0; i < 30; i += 1) {
    if (await page.getByText(/Aucune r.f.rence\./i).isVisible()) return;

    const rowCheckboxes = page.getByRole("checkbox", { name: /S.lectionner /i });
    const count = await rowCheckboxes.count();
    if (count === 0) {
      await page.waitForTimeout(300);
      continue;
    }

    for (let idx = 0; idx < count; idx += 1) {
      await rowCheckboxes.nth(idx).check();
    }

    await page.getByRole("button", { name: "Supprimer" }).click();
    await page.waitForTimeout(400);
  }

  await expect(page.getByText(/Aucune r.f.rence\./i)).toBeVisible();
}

async function maybeGetLoadedImageSrc(cardButton: import("@playwright/test").Locator) {
  const cardImage = cardButton.locator("img").first();
  if ((await cardImage.count()) === 0) return null;

  await expect(cardImage).toBeVisible();
  await expect
    .poll(async () => cardImage.evaluate((img) => (img as HTMLImageElement).naturalWidth))
    .toBeGreaterThan(0);
  return (await cardImage.getAttribute("src")) ?? null;
}

test("backoffice references create and delete", async ({ page }) => {
  requireAdminCreds();
  await loginAsAdmin(page);

  const referenceName = `Ref E2E ${Date.now()}`;
  await createReference(page, referenceName, "Situation E2E");
  await deleteReference(page, referenceName);
});

test("frontoffice reference modal shows details", async ({ page }) => {
  requireAdminCreds();
  await loginAsAdmin(page);

  const referenceName = `Ref Front ${Date.now()}`;
  const situation = "Situation front E2E";
  await createReference(page, referenceName, situation);

  await page.goto("/");
  await page.locator("section#references").scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: `Ouvrir la mission : ${referenceName}` }).click();

  const modal = page.getByRole("dialog", { name: new RegExp(referenceName) });
  await expect(modal).toBeVisible();
  await expect(modal.getByText("Situation", { exact: true })).toBeVisible();
  await expect(modal.getByText(situation)).toBeVisible();

  await openReferencesManager(page);
  await deleteReference(page, referenceName);
});

test("references flow: create, replace image, add icon, delete all and hide menu", async ({ page }) => {
  requireAdminCreds();
  await loginAsAdmin(page);
  await openReferencesManager(page);
  await deleteAllReferences(page);

  const referenceName = `Ref Full E2E ${Date.now()}`;
  const firstImagePath = path.join(process.cwd(), "public", "brand", "logo.png");
  const secondImagePath = path.join(process.cwd(), "public", "les-castas.png");
  const iconPath = path.join(process.cwd(), "public", "badges", "french-tech.png");

  await page.getByRole("button", { name: "Ajouter" }).click();
  await expect(page.getByText(/Cr.er une r.f.rence/i)).toBeVisible();
  await uploadWithChooser(page, /Charger l.?image/i, firstImagePath);
  await page.getByLabel(/R.f.rence/i).fill(referenceName);
  await page.getByLabel("Situation").fill("Situation flux complet E2E");
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText(referenceName)).toBeVisible();

  await page.goto("/");
  await page.locator("section#references").scrollIntoViewIfNeeded();
  const cardButton = page.getByRole("button", { name: `Ouvrir la mission : ${referenceName}` });
  await expect(cardButton).toBeVisible();
  const firstRenderedSrc = await maybeGetLoadedImageSrc(cardButton);

  await openReferencesManager(page);
  await page.getByRole("row", { name: new RegExp(referenceName) }).click();
  await expect(page.getByText(/Modifier la r.f.rence/i)).toBeVisible();
  await uploadWithChooser(page, /Charger l.?image/i, secondImagePath);
  await page.getByRole("button", { name: "Enregistrer" }).click();

  await page.goto("/");
  await page.locator("section#references").scrollIntoViewIfNeeded();
  const updatedCardButton = page.getByRole("button", { name: `Ouvrir la mission : ${referenceName}` });
  await expect(updatedCardButton).toBeVisible();
  const updatedRenderedSrc = await maybeGetLoadedImageSrc(updatedCardButton);
  if (firstRenderedSrc && updatedRenderedSrc) {
    expect(updatedRenderedSrc).not.toBe(firstRenderedSrc);
  }

  await openReferencesManager(page);
  await page.getByRole("row", { name: new RegExp(referenceName) }).click();
  await uploadWithChooser(page, /Charger l.?ic.ne/i, iconPath);
  await page.getByRole("button", { name: "Enregistrer" }).click();

  await page.goto("/");
  await page.locator("section#references").scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: `Ouvrir la mission : ${referenceName}` }).click();
  const icon = page.getByRole("img", { name: /Ic.ne|Badge/i });
  if ((await icon.count()) > 0) {
    await expect(icon).toBeVisible();
    await expect
      .poll(async () => icon.evaluate((img) => (img as HTMLImageElement).naturalWidth))
      .toBeGreaterThan(0);
  }

  await openReferencesManager(page);
  await deleteAllReferences(page);

  await page.goto("/");
  await expect(page.locator("header").getByRole("link", { name: /R.f.rences/i })).toHaveCount(0);
  await expect(page.locator("section#references")).toHaveCount(0);
});
