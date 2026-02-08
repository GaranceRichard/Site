import { defineConfig } from "@playwright/test";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, ".env.local"), quiet: true });
dotenv.config({ path: path.resolve(__dirname, ".env.e2e.local"), quiet: true });

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
  },
  expect: {
    timeout: 10_000,
  },
});
