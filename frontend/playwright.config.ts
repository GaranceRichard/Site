import { defineConfig } from "@playwright/test";
import path from "path";
import dotenv from "dotenv";
import { getE2EBackendEnv, getE2EPaths, getE2EPorts, getE2EUrls } from "./src/e2e/config";

dotenv.config({ path: path.resolve(__dirname, ".env.local"), quiet: true });
dotenv.config({ path: path.resolve(__dirname, ".env.e2e.local"), quiet: true });

const e2ePorts = getE2EPorts(process.env);

process.env.E2E_FRONTEND_PORT = String(e2ePorts.frontendPort);
process.env.E2E_BACKEND_PORT = String(e2ePorts.backendPort);
process.env.E2E_BASE_URL = `http://127.0.0.1:${e2ePorts.frontendPort}`;
process.env.E2E_API_BASE_URL = `http://127.0.0.1:${e2ePorts.backendPort}`;
process.env.NEXT_PUBLIC_API_BASE_URL = process.env.E2E_API_BASE_URL;

const e2eUrls = getE2EUrls(process.env);
const e2ePaths = getE2EPaths(process.env);
const backendEnv = getE2EBackendEnv(process.env);

process.env.E2E_SANDBOX_ROOT = e2ePaths.sandboxRoot;

for (const [key, value] of Object.entries(backendEnv)) {
  process.env[key] = value;
}

export default defineConfig({
  testDir: path.resolve(__dirname, "tests"),
  testMatch: /.*\.spec\.ts/,
  testIgnore: /(?:^|[\\/])(fixtures|helpers)\.ts$/,
  timeout: 30_000,
  webServer: [
    {
      command: "node ./scripts/start-e2e-backend.mjs",
      cwd: __dirname,
      url: `${e2eUrls.apiBaseURL}/api/health`,
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: "node ./scripts/start-e2e-frontend.mjs",
      cwd: __dirname,
      url: e2eUrls.baseURL,
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
  use: {
    baseURL: e2eUrls.baseURL,
    trace: "on-first-retry",
  },
  expect: {
    timeout: 10_000,
  },
});
