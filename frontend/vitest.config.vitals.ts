import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: "./vitest.setup.ts",
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.{idea,git,cache,output,temp}/**",
      "tests/**",
    ],
    coverage: {
      provider: "v8",
      reportsDirectory: "coverage-vitals",
      reporter: [["text", { maxCols: 160 }], "lcov"],
      all: true,
      include: [
        "src/app/backoffice/**/*.{ts,tsx}",
        "src/app/contact/ContactForm.tsx",
        "src/app/components/BackofficeModal.tsx",
        "src/app/components/backoffice/**/*.{ts,tsx}",
        "src/app/lib/backoffice.ts",
      ],
      thresholds: {
        lines: 95,
        statements: 95,
        branches: 95,
        functions: 95,
        perFile: true,
      },
      exclude: [
        ".next/**",
        "**/node_modules/**",
        "**/dist/**",
        "**/.{idea,git,cache,output,temp}/**",
        "tests/**",
        "src/**/*.test.{ts,tsx}",
        "src/**/*.spec.{ts,tsx}",
        "src/**/index.ts",
        "src/**/*.types.ts",
        "src/**/types.ts",
        "src/**/*.d.ts",
      ],
    },
  },
});
