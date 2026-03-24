import { expect, test } from "./fixtures";
import { getAdminAccessToken, requireAdminCreds } from "./helpers";
import { getE2EUrls } from "../src/e2e/config";

const apiBase = getE2EUrls(process.env).apiBaseURL;

test("custom publication is rendered on the public homepage", async ({ page }) => {
  requireAdminCreds();

  const token = await getAdminAccessToken();
  const publicResponse = await fetch(`${apiBase}/api/settings/`);
  expect(publicResponse.ok).toBeTruthy();

  const currentSettings = (await publicResponse.json()) as {
    header: unknown;
    homeHero: unknown;
    promise: unknown;
    method: unknown;
    publications: {
      title: string;
      subtitle: string;
      highlight: {
        title: string;
        content: string;
      };
      items: Array<{
        id: string;
        title: string;
        content: string;
        links?: Array<{
          id: string;
          title: string;
          url: string;
        }>;
      }>;
    };
  };

  const stamp = Date.now();
  const publicationTitle = `Arbitrer avec la donnée ${stamp}`;
  const publicationContent = `Texte Monte Carlo ${stamp}`;
  const publicationLinkTitle = `Démo ${stamp}`;
  const publicationLinkUrl = `https://example.com/demo-${stamp}`;

  const saveResponse = await fetch(`${apiBase}/api/settings/admin/`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...currentSettings,
      publications: {
        ...currentSettings.publications,
        items: [
          {
            id: "publication-1",
            title: publicationTitle,
            content: publicationContent,
            links: [
              {
                id: "publication-1-link-1",
                title: publicationLinkTitle,
                url: publicationLinkUrl,
              },
            ],
          },
          ...currentSettings.publications.items.slice(1),
        ],
      },
    }),
  });
  expect(saveResponse.ok).toBeTruthy();

  await page.goto("/");
  await expect(page.locator("#services")).toContainText(publicationTitle);

  await page.getByRole("button", { name: new RegExp(publicationTitle) }).click();
  await expect(page.getByRole("dialog")).toContainText(publicationContent);
  await expect(page.getByRole("link", { name: publicationLinkTitle })).toHaveAttribute(
    "href",
    publicationLinkUrl,
  );
});
