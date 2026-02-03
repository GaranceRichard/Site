/* eslint-disable @typescript-eslint/no-require-imports */
const { spawnSync } = require("node:child_process");
const path = require("node:path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), quiet: true });
dotenv.config({ path: path.resolve(process.cwd(), ".env.e2e.local"), quiet: true });

const configPath = process.argv[2] || "./lighthouserc.json";
const lhciCli = require.resolve("@lhci/cli/src/cli.js", {
  paths: [process.cwd()],
});

const result = spawnSync(
  process.execPath,
  [lhciCli, "autorun", `--config=${configPath}`],
  {
    stdio: "inherit",
    env: process.env,
  },
);

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
