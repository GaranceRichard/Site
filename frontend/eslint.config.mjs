import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Avoid linting the flat-config file itself; some upstream rule stacks
    // can break on config modules during major ESLint transitions.
    "eslint.config.mjs",
    // Next config modules are executable config, not React source files.
    "next.config.ts",
    // Tooling config modules are not React components and can trip React rules
    // during upstream ESLint/plugin version transitions.
    "playwright.config.ts",
    "vitest.config.mjs",
    "vitest.config.vitals.mjs",
    // Node build/test helpers are not React source files.
    "scripts/**",
    "postcss.config.mjs",
    "tailwind.config.mjs",
    "lighthouserc*.json",
    // Default ignores of eslint-config-next:
    ".next/**",
    ".next-e2e/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Project-specific generated artifacts:
    "coverage/**",
    "coverage-vitals/**",
    "coverage-e2e/**",
    "coverage-e2e-report/**",
    ".e2e-virtual/**",
    ".demo-build-workdir/**",
    ".lighthouseci/**",
    "test-results/**",
  ]),
]);

export default eslintConfig;
