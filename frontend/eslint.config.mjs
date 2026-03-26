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
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Project-specific generated artifacts:
    "coverage/**",
    "coverage-vitals/**",
    "coverage-e2e/**",
    "coverage-e2e-report/**",
    ".e2e-virtual/**",
    ".lighthouseci/**",
    "test-results/**",
  ]),
]);

export default eslintConfig;
