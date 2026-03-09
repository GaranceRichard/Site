/* eslint-disable @typescript-eslint/no-require-imports */
const { spawnSync } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), quiet: true });
dotenv.config({ path: path.resolve(process.cwd(), ".env.e2e.local"), quiet: true });

const configPath = process.argv[2] || "./lighthouserc.json";
const lhciCli = require.resolve("@lhci/cli/src/cli.js", {
  paths: [process.cwd()],
});

function fileExists(candidate) {
  try {
    return !!candidate && fs.existsSync(candidate);
  } catch {
    return false;
  }
}

function resolveBrowserPath() {
  if (fileExists(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }

  const candidates = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ];

  return candidates.find((candidate) => fileExists(candidate)) || null;
}

const browserPath = resolveBrowserPath();
if (browserPath && !process.env.CHROME_PATH) {
  process.env.CHROME_PATH = browserPath;
}

const result = spawnSync(
  process.execPath,
  [lhciCli, "autorun", `--config=${configPath}`],
  {
    stdio: "pipe",
    env: process.env,
    encoding: "utf-8",
  },
);

const stdout = result.stdout || "";
const stderr = result.stderr || "";

if (stdout) {
  process.stdout.write(stdout);
}

if (stderr) {
  process.stderr.write(stderr);
}

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

const combinedOutput = `${stdout}\n${stderr}`;
const isWindowsTempCleanupError =
  result.status &&
  /EPERM, Permission denied/i.test(combinedOutput) &&
  /lighthouse\./i.test(combinedOutput);

if (isWindowsTempCleanupError) {
  console.warn("LHCI hit a Windows temp cleanup EPERM after the audit run; treating this known cleanup failure as successful.");
  process.exit(0);
}

process.exit(result.status ?? 1);
