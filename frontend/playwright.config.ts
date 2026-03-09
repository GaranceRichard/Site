import { defineConfig } from "@playwright/test";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, ".env.local"), quiet: true });
dotenv.config({ path: path.resolve(__dirname, ".env.e2e.local"), quiet: true });

export default defineConfig({
  testDir: path.resolve(__dirname, "tests"),
  testMatch: /.*\.spec\.ts/,
  testIgnore: /(?:^|[\\/])(fixtures|helpers)\.ts$/,
  timeout: 30_000,
  webServer: [
    {
      command:
        'powershell -ExecutionPolicy Bypass -Command "if (Test-Path .\\\\.venv\\\\Scripts\\\\Activate.ps1) { . .\\\\.venv\\\\Scripts\\\\Activate.ps1 }; python manage.py runserver 127.0.0.1:8000 --noreload"',
      cwd: path.resolve(__dirname, "..", "backend"),
      url: "http://127.0.0.1:8000/api/health",
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: "npm run dev -- --port 3000",
      cwd: __dirname,
      url: process.env.E2E_BASE_URL || "http://localhost:3000",
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
  },
  expect: {
    timeout: 10_000,
  },
});
