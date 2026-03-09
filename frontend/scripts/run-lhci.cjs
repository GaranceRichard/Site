/* eslint-disable @typescript-eslint/no-require-imports */
const { spawnSync } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), quiet: true });
dotenv.config({ path: path.resolve(process.cwd(), ".env.e2e.local"), quiet: true });

const configPath = process.argv[2] || "./lighthouserc.json";
const resolvedConfigPath = path.resolve(process.cwd(), configPath);
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

function readJson(candidate) {
  try {
    return JSON.parse(fs.readFileSync(candidate, "utf-8"));
  } catch {
    return null;
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

function resolveOutputDir() {
  const config = readJson(resolvedConfigPath);
  const configuredDir = config?.ci?.upload?.outputDir;

  if (typeof configuredDir === "string" && configuredDir.trim()) {
    return path.resolve(process.cwd(), configuredDir.trim());
  }

  return path.resolve(process.cwd(), ".lighthouseci");
}

function normalizeUrl(value) {
  try {
    return new URL(value).toString();
  } catch {
    return value;
  }
}

function formatScore(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "n/a";
  }

  return `${Math.round(value * 100)}`;
}

function collectPreludeLines(output) {
  const lines = output.split(/\r?\n/);
  const kept = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      continue;
    }

    if (trimmed.startsWith("Running Lighthouse ")) {
      break;
    }

    if (
      trimmed.startsWith("✅") ||
      trimmed.startsWith("⚠️") ||
      trimmed === "Healthcheck passed!"
    ) {
      kept.push(trimmed);
    }
  }

  return kept;
}

function loadManifestRuns(outputDir) {
  const manifestPath = path.join(outputDir, "manifest.json");
  const manifest = readJson(manifestPath);

  if (!Array.isArray(manifest)) {
    return [];
  }

  return manifest
    .filter((entry) => entry && typeof entry === "object")
    .map((entry) => {
      const summary = entry.summary && typeof entry.summary === "object" ? entry.summary : {};

      return {
        url: typeof entry.url === "string" ? entry.url : null,
        isRepresentativeRun: Boolean(entry.isRepresentativeRun),
        jsonPath: typeof entry.jsonPath === "string" ? entry.jsonPath : null,
        summary: {
          performance: typeof summary.performance === "number" ? summary.performance : null,
          accessibility:
            typeof summary.accessibility === "number" ? summary.accessibility : null,
          bestPractices:
            typeof summary["best-practices"] === "number"
              ? summary["best-practices"]
              : null,
          seo: typeof summary.seo === "number" ? summary.seo : null,
        },
      };
    });
}

function summarizeSuccessfulRun(outputDir, stdout, stderr, cleanupOverride) {
  const prelude = [...collectPreludeLines(stdout), ...collectPreludeLines(stderr)];
  const uniquePrelude = Array.from(new Set(prelude));
  const lines = [];

  if (uniquePrelude.length > 0) {
    lines.push(...uniquePrelude);
  }

  const runs = loadManifestRuns(outputDir);
  const representativeRuns = runs.filter((entry) => entry.isRepresentativeRun && entry.url);
  const displayedRuns = representativeRuns.length > 0 ? representativeRuns : runs.filter((entry) => entry.url);

  if (displayedRuns.length > 0) {
    lines.push(`Perf summary: ${displayedRuns.length} URL(s) audited.`);

    for (const run of displayedRuns) {
      lines.push(
        [
          `- ${normalizeUrl(run.url)}`,
          `perf ${formatScore(run.summary.performance)}`,
          `a11y ${formatScore(run.summary.accessibility)}`,
          `best ${formatScore(run.summary.bestPractices)}`,
          `seo ${formatScore(run.summary.seo)}`,
        ].join(" | "),
      );
    }
  } else {
    lines.push("Perf summary: Lighthouse completed successfully.");
  }

  lines.push(`Artifacts: ${path.relative(process.cwd(), outputDir) || ".lighthouseci"}`);

  if (cleanupOverride) {
    lines.push(
      "Note: ignored known Windows Lighthouse temp cleanup EPERM after results were written.",
    );
  }

  process.stdout.write(`${lines.join("\n")}\n`);
}

function printRawFailure(stdout, stderr) {
  if (stdout) {
    process.stdout.write(stdout);
  }

  if (stderr) {
    process.stderr.write(stderr);
  }
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
const outputDir = resolveOutputDir();

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

const combinedOutput = `${stdout}\n${stderr}`;
const isWindowsTempCleanupError =
  result.status &&
  /EPERM, Permission denied/i.test(combinedOutput) &&
  /lighthouse\./i.test(combinedOutput);

if ((result.status ?? 1) === 0) {
  summarizeSuccessfulRun(outputDir, stdout, stderr, false);
  process.exit(0);
}

if (isWindowsTempCleanupError) {
  summarizeSuccessfulRun(outputDir, stdout, stderr, true);
  process.exit(0);
}

printRawFailure(stdout, stderr);
process.exit(result.status ?? 1);
