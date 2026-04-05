import fs from "node:fs";
import path from "node:path";
import { expect, test } from "./fixtures";
import { getE2EPaths, getE2EUrls } from "../src/e2e/config";
import { getAdminAccessToken, loginAsAdmin, requireAdminCreds } from "./helpers";

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

async function maybeGetImageSrc(cardButton: import("@playwright/test").Locator) {
  const cardImage = cardButton.locator("img").first();
  if ((await cardImage.count()) === 0) return null;

  await expect(cardImage).toBeVisible();
  return (await cardImage.getAttribute("src")) ?? null;
}

type AdminReference = {
  id: number;
  reference: string;
  image: string;
  image_thumb?: string;
  icon: string;
};

function mediaPathFromUrl(rawUrl: string) {
  const trimmed = rawUrl.trim();
  if (!trimmed) return "";
  const { apiBaseURL } = getE2EUrls(process.env);
  const normalized = trimmed.startsWith("http")
    ? new URL(trimmed)
    : new URL(trimmed, apiBaseURL);
  const [, relPath = ""] = normalized.pathname.split("/media/");
  return relPath;
}

function absoluteMediaPath(relPath: string) {
  const normalized = relPath.replaceAll("/", path.sep);
  return path.join(getE2EPaths(process.env).djangoMediaRoot, normalized);
}

async function fetchAdminReferenceByName(
  request: import("@playwright/test").APIRequestContext,
  referenceName: string,
) {
  const accessToken = await getAdminAccessToken();
  const { apiBaseURL } = getE2EUrls(process.env);
  const response = await request.get(`${apiBaseURL}/api/contact/references/admin`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  expect(response.ok()).toBeTruthy();
  const payload = (await response.json()) as AdminReference[];
  const reference = payload.find((item) => item.reference === referenceName) ?? null;
  expect(reference).not.toBeNull();
  return reference as AdminReference;
}

async function fetchPublicReferenceByName(
  request: import("@playwright/test").APIRequestContext,
  referenceName: string,
) {
  const { apiBaseURL } = getE2EUrls(process.env);
  const response = await request.get(`${apiBaseURL}/api/contact/references`);

  expect(response.ok()).toBeTruthy();
  const payload = (await response.json()) as AdminReference[];
  const reference = payload.find((item) => item.reference === referenceName) ?? null;
  expect(reference).not.toBeNull();
  return reference as AdminReference;
}

async function expectPublicReferenceToMatchAdmin(
  request: import("@playwright/test").APIRequestContext,
  referenceName: string,
  expected: Partial<Pick<AdminReference, "image" | "image_thumb" | "icon">>,
) {
  const normalizedExpected: Record<string, string> = {};
  if (typeof expected.image !== "undefined") {
    normalizedExpected.image = expected.image;
  }
  if (typeof expected.image_thumb !== "undefined") {
    normalizedExpected.image_thumb = expected.image_thumb ?? "";
  }
  if (typeof expected.icon !== "undefined") {
    normalizedExpected.icon = expected.icon ?? "";
  }

  await expect
    .poll(async () => {
      const reference = await fetchPublicReferenceByName(request, referenceName);
      return {
        image: reference.image,
        image_thumb: reference.image_thumb ?? "",
        icon: reference.icon,
      };
    })
    .toMatchObject(normalizedExpected);
}

async function waitForMediaReady(
  _request: import("@playwright/test").APIRequestContext,
  mediaUrl: string | null | undefined,
) {
  const mediaPath = mediaPathFromUrl(mediaUrl ?? "");
  expect(mediaPath).not.toBe("");

  await expect
    .poll(async () => {
      return fs.existsSync(absoluteMediaPath(mediaPath));
    }, { timeout: 30_000 })
    .toBeTruthy();
}

async function waitForReferenceMediaReady(
  _request: import("@playwright/test").APIRequestContext,
  reference: Pick<AdminReference, "image" | "image_thumb">,
) {
  const candidates = [reference.image_thumb, reference.image]
    .map((value) => mediaPathFromUrl(value ?? ""))
    .filter(Boolean);

  expect(candidates.length).toBeGreaterThan(0);

  await expect
    .poll(async () => {
      for (const mediaPath of candidates) {
        if (fs.existsSync(absoluteMediaPath(mediaPath))) {
          return true;
        }
      }
      return false;
    }, { timeout: 30_000 })
    .toBeTruthy();
}

async function waitForReferenceIconPath(
  request: import("@playwright/test").APIRequestContext,
  referenceName: string,
  scope: "admin" | "public",
) {
  await expect
    .poll(async () => {
      const reference = scope === "admin"
        ? await fetchAdminReferenceByName(request, referenceName)
        : await fetchPublicReferenceByName(request, referenceName);
      return mediaPathFromUrl(reference.icon);
    })
    .not.toBe("");

  const reference = scope === "admin"
    ? await fetchAdminReferenceByName(request, referenceName)
    : await fetchPublicReferenceByName(request, referenceName);
  return mediaPathFromUrl(reference.icon);
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

test("frontoffice reference modal renders mocked public data @coverage", async ({ page }) => {
  await page.goto("/e2e-reference-modal");

  const openButton = page.getByRole("button", { name: "Open modal" });
  await openButton.focus();
  await openButton.click();

  const modal = page.getByRole("dialog", { name: /Ref Harness Modal/i });
  await expect(modal).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(modal).toHaveCount(0);
  await expect(page.getByText("Close count: 1")).toBeVisible();

  await page.getByRole("button", { name: "Open modal" }).click();
  await expect(modal).toBeVisible();
  await page.getByRole("button", { name: "Force close modal" }).click();
  await expect(modal).toHaveCount(0);
  await expect(page.getByText("Close count: 1")).toBeVisible();

  await page.getByRole("button", { name: "Open modal" }).click();
  await expect(modal).toBeVisible();
  await modal.getByText("X", { exact: true }).click();
  await expect(modal).toHaveCount(0);
  await expect(page.getByText("Close count: 2")).toBeVisible();

  await page.getByRole("button", { name: "Open modal" }).click();
  await expect(modal).toBeVisible();
  await page.goto("/");
  await expect(modal).toHaveCount(0);
});

test("references flow: create, replace image, add icon, delete all and hide menu", async ({ page, request }) => {
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
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().includes("/api/contact/references/admin") &&
        response.request().method() === "POST" &&
        response.ok(),
    ),
    page.getByRole("button", { name: "Enregistrer" }).click(),
  ]);
  await expect(page.getByText(referenceName)).toBeVisible();
  const createdReference = await fetchPublicReferenceByName(request, referenceName);
  await waitForReferenceMediaReady(request, createdReference);

  await page.goto("/");
  await page.locator("section#references").scrollIntoViewIfNeeded();
  const cardButton = page.getByRole("button", { name: `Ouvrir la mission : ${referenceName}` });
  await expect(cardButton).toBeVisible();
  const firstRenderedSrc = await maybeGetImageSrc(cardButton);

  await openReferencesManager(page);
  await page.getByRole("row", { name: new RegExp(referenceName) }).click();
  await expect(page.getByText(/Modifier la r.f.rence/i)).toBeVisible();
  await uploadWithChooser(page, /Charger l.?image/i, secondImagePath);
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().includes("/api/contact/references/admin/") &&
        response.request().method() === "PUT" &&
        response.ok(),
    ),
    page.getByRole("button", { name: "Enregistrer" }).click(),
  ]);
  const updatedAdminReference = await fetchAdminReferenceByName(request, referenceName);
  await expectPublicReferenceToMatchAdmin(request, referenceName, {
    image: updatedAdminReference.image,
    image_thumb: updatedAdminReference.image_thumb,
  });
  const updatedReference = await fetchPublicReferenceByName(request, referenceName);
  await waitForReferenceMediaReady(request, updatedReference);

  await page.goto("/");
  await page.locator("section#references").scrollIntoViewIfNeeded();
  const updatedCardButton = page.getByRole("button", { name: `Ouvrir la mission : ${referenceName}` });
  await expect(updatedCardButton).toBeVisible();
  const updatedRenderedSrc = await maybeGetImageSrc(updatedCardButton);
  if (firstRenderedSrc && updatedRenderedSrc) {
    expect(updatedRenderedSrc).not.toBe(firstRenderedSrc);
  }

  await openReferencesManager(page);
  await page.getByRole("row", { name: new RegExp(referenceName) }).click();
  await uploadWithChooser(page, /Charger l.?ic.ne/i, iconPath);
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().includes("/api/contact/references/admin/") &&
        response.request().method() === "PUT" &&
        response.ok(),
    ),
    page.getByRole("button", { name: "Enregistrer" }).click(),
  ]);
  const iconAdminReference = await fetchAdminReferenceByName(request, referenceName);
  await expectPublicReferenceToMatchAdmin(request, referenceName, {
    icon: iconAdminReference.icon,
  });
  const iconReadyReference = await fetchPublicReferenceByName(request, referenceName);
  await waitForMediaReady(request, iconReadyReference.icon);
  const iconMediaPath = mediaPathFromUrl(iconReadyReference.icon);

  await page.goto("/");
  await page.locator("section#references").scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: `Ouvrir la mission : ${referenceName}` }).click();
  const modal = page.getByRole("dialog", { name: new RegExp(referenceName) });
  await expect(modal).toBeVisible();
  await expect(modal.getByText(referenceName, { exact: true })).toBeVisible();
  const icon = modal.getByRole("img", { name: /Ic.ne|Badge/i });
  if ((await icon.count()) > 0) {
    await expect(icon).toHaveAttribute(
      "src",
      new RegExp(iconMediaPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
  }

  await openReferencesManager(page);
  await deleteAllReferences(page);

  await page.goto("/");
  await expect(page.locator("header").getByRole("link", { name: /R.f.rences/i })).toHaveCount(0);
  await expect(page.locator("section#references")).toHaveCount(0);
});

test("reference icon replacement keeps front modal and media integrity", async ({
  page,
  request,
}) => {
  requireAdminCreds();
  await loginAsAdmin(page);

  const referenceName = `Ref Icon E2E ${Date.now()}`;
  const firstIconPath = path.join(process.cwd(), "public", "badges", "french-tech.png");
  const secondIconPath = path.join(process.cwd(), "public", "les-castas.png");

  await createReference(page, referenceName, "Situation icon E2E");

  await openReferencesManager(page);
  await page.getByRole("row", { name: new RegExp(referenceName) }).click();
  await expect(page.getByText(/Modifier la r.f.rence/i)).toBeVisible();
  await uploadWithChooser(page, /Charger l.?ic.ne/i, firstIconPath);
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText(referenceName)).toBeVisible();

  const firstIconMediaPath = await waitForReferenceIconPath(request, referenceName, "admin");
  const firstPublicReference = await fetchPublicReferenceByName(request, referenceName);

  expect(mediaPathFromUrl(firstPublicReference.icon)).toBe(firstIconMediaPath);
  expect(fs.existsSync(absoluteMediaPath(firstIconMediaPath))).toBeTruthy();

  await openReferencesManager(page);
  await page.getByRole("row", { name: new RegExp(referenceName) }).click();
  await uploadWithChooser(page, /Charger l.?ic.ne/i, secondIconPath);
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText(referenceName)).toBeVisible();

  const updatedIconMediaPath = await waitForReferenceIconPath(request, referenceName, "admin");
  const updatedAdminReference = await fetchAdminReferenceByName(request, referenceName);
  const updatedPublicReference = await fetchPublicReferenceByName(request, referenceName);

  expect(updatedIconMediaPath).not.toBe(firstIconMediaPath);
  expect(mediaPathFromUrl(updatedPublicReference.icon)).toBe(updatedIconMediaPath);
  expect(fs.existsSync(absoluteMediaPath(updatedIconMediaPath))).toBeTruthy();
  expect(fs.existsSync(absoluteMediaPath(firstIconMediaPath))).toBeFalsy();
  expect(updatedAdminReference.icon).not.toContain(firstIconMediaPath);

  await page.goto("/");
  await page.locator("section#references").scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: `Ouvrir la mission : ${referenceName}` }).click();

  const modal = page.getByRole("dialog", { name: new RegExp(referenceName) });
  await expect(modal).toBeVisible();
  await expect(modal.getByText(referenceName, { exact: true })).toBeVisible();
  const icon = modal.getByRole("img", { name: /Ic.ne|Badge/i });
  if ((await icon.count()) > 0) {
    await expect(icon).toHaveAttribute(
      "src",
      new RegExp(updatedIconMediaPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
  }

  await openReferencesManager(page);
  await deleteReference(page, referenceName);
});
