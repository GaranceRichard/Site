import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { test as base } from "@playwright/test";

type CoverageOpts = {
  page: import("@playwright/test").Page;
};

const shouldCollectCoverage = () => process.env.E2E_COVERAGE === "true";

export const test = base.extend<CoverageOpts>({
  page: async ({ page }, use, testInfo) => {
    const isChromium = testInfo.project.name.toLowerCase().includes("chromium");
    const collect = shouldCollectCoverage() && isChromium;

    if (collect) {
      await page.coverage.startJSCoverage();
    }

    await use(page);

    if (collect) {
      const coverage = await page.coverage.stopJSCoverage();
      const outDir = path.join(process.cwd(), "coverage-e2e");
      fs.mkdirSync(outDir, { recursive: true });

      const hash = crypto.createHash("sha1").update(testInfo.titlePath.join(" ")).digest("hex");
      const filePath = path.join(outDir, `v8-${hash}.json`);
      fs.writeFileSync(filePath, JSON.stringify(coverage), "utf-8");
    }
  },
});

export { expect } from "@playwright/test";
