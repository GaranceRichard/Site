import { expect, test } from "./fixtures";
import { loginAsAdmin, requireAdminCreds } from "./helpers";

test.describe.configure({ mode: "serial" });

async function openSidebarSection(page: import("@playwright/test").Page, label: RegExp) {
  await page.goto("/backoffice");
  await page.getByRole("button", { name: label }).click();
}

test("header settings are editable and reflected on front", async ({ page }) => {
  requireAdminCreds();
  await loginAsAdmin(page);
  await openSidebarSection(page, /^Header$/i);

  const stamp = Date.now();
  const name = `E2E Header ${stamp}`;
  const title = `Titre ${stamp}`;
  const bookingUrl = `https://example.com/e2e-${stamp}`;

  await page.getByLabel("Nom").fill(name);
  await page.getByLabel("Titre").fill(title);
  await page.getByLabel("Adresse de prise de rendez-vous").fill(bookingUrl);
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText(/Header mis a jour/i)).toBeVisible();

  await page.goto("/");
  const brandButton = page.getByRole("button", { name: /Aller au backoffice|Aller à l’accueil/i });
  await expect(brandButton.getByText(name)).toBeVisible();
  await expect(brandButton.getByText(title)).toBeVisible();
  await expect(page.locator("header").getByRole("link", { name: /changer/i })).toHaveAttribute(
    "href",
    bookingUrl,
  );
});

test("home titles are editable and reflected on hero", async ({ page }) => {
  requireAdminCreds();
  await loginAsAdmin(page);
  await openSidebarSection(page, /^Accueil$/i);

  const stamp = Date.now();
  const eyebrow = `Sur-titre E2E ${stamp}`;
  const title = `Titre E2E ${stamp}\nSeconde ligne ${stamp}`;
  const subtitle = `Sous-titre E2E ${stamp}`;

  await page.getByRole("button", { name: "Titres" }).click();
  await page.getByRole("textbox", { name: "Sur-titre", exact: true }).fill(eyebrow);
  await page.getByRole("textbox", { name: "Titre", exact: true }).fill(title);
  await page.getByRole("textbox", { name: "Sous-titre", exact: true }).fill(subtitle);
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText(/Accueil mis a jour/i)).toBeVisible();

  await page.goto("/");
  await expect(page.getByText(eyebrow)).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: new RegExp(`Titre E2E ${stamp}`) })).toBeVisible();
  await expect(page.getByText(`Seconde ligne ${stamp}`)).toBeVisible();
  await expect(page.getByText(subtitle)).toBeVisible();
});

test("home cards can be added and rendered as bullet list", async ({ page }) => {
  requireAdminCreds();
  await loginAsAdmin(page);
  await openSidebarSection(page, /^Accueil$/i);

  const stamp = Date.now();
  const cardTitle = `Encart E2E ${stamp}`;
  const bulletA = `Point A ${stamp}`;
  const bulletB = `Point B ${stamp}`;

  await page.getByRole("button", { name: "Encarts" }).click();
  await page.getByRole("button", { name: "Ajouter" }).click();

  const titleInputs = page.getByLabel("Titre encart");
  const contentInputs = page.getByLabel("Contenu (1 ligne = 1 puce)");
  const lastCardIndex = (await titleInputs.count()) - 1;

  await titleInputs.nth(lastCardIndex).fill(cardTitle);
  await contentInputs.nth(lastCardIndex).fill(`${bulletA}\n${bulletB}`);
  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText(/Accueil mis a jour/i)).toBeVisible();

  await page.goto("/");
  await expect(page.getByText(cardTitle)).toBeVisible();
  await expect(page.getByText(bulletA)).toBeVisible();
  await expect(page.getByText(bulletB)).toBeVisible();
});

test("home links and keywords are editable and reflected on hero", async ({ page }) => {
  requireAdminCreds();
  await loginAsAdmin(page);
  await openSidebarSection(page, /^Accueil$/i);

  const stamp = Date.now();
  const messageLabel = `Echanger ${stamp}`;
  const keyword = `Motcle${stamp}`;

  await page.getByRole("button", { name: "Liens et mots clefs" }).click();

  const messageCard = page.getByText("6. #message").locator("xpath=ancestor::div[2]");
  await messageCard.getByRole("checkbox", { name: "Actif" }).check();
  await messageCard.getByRole("textbox").fill(messageLabel);

  const keywordInputs = page.locator("span", { hasText: /mot-cle/i });
  const keywordCount = await keywordInputs.count();
  if (keywordCount < 5) {
    for (let i = keywordCount; i < 5; i += 1) {
      await page.getByRole("button", { name: "Ajouter" }).last().click();
    }
  }

  const firstKeywordCard = page.getByText("1. mot-cle").locator("xpath=ancestor::div[1]");
  await firstKeywordCard.getByRole("textbox").fill(keyword);

  await page.getByRole("button", { name: "Enregistrer" }).click();
  await expect(page.getByText(/Accueil mis a jour/i)).toBeVisible();

  await page.goto("/");
  await expect(page.getByRole("link", { name: messageLabel })).toHaveAttribute("href", "/contact");
  await expect(page.getByText(keyword)).toBeVisible();
});
