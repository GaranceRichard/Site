import { spawnSync } from "node:child_process";
import { rmSync } from "node:fs";
import path from "node:path";

const forwardedArgs = process.argv.slice(2);
const vitestArgs = ["./node_modules/vitest/vitest.mjs", "run", "--coverage", ...forwardedArgs];
const ansiPattern = /\u001B\[[0-9;]*[A-Za-z]/g;
const configArgIndex = forwardedArgs.indexOf("--config");
const configPath =
  configArgIndex >= 0 && forwardedArgs[configArgIndex + 1]
    ? forwardedArgs[configArgIndex + 1]
    : "";
const coverageDir = path.join(
  process.cwd(),
  configPath.includes("vitals") ? "coverage-vitals" : "coverage",
);

function stripAnsi(output) {
  return output.replaceAll(ansiPattern, "");
}

function hasCoverageTmpError(output) {
  return output.includes("coverage\\.tmp") || output.includes("coverage/.tmp");
}

function hasTransientStartupError(output) {
  return (
    output.includes("failed to load config from") ||
    output.includes("Startup Error") ||
    output.includes("Error: spawn EPERM") ||
    output.includes("The service was stopped") ||
    output.includes("The system cannot find the file specified")
  );
}

function testsPassed(output) {
  return (
    /Test Files\s+\d+\s+passed/.test(output) &&
    !/Test Files\s+\d+\s+failed/.test(output) &&
    /Tests\s+\d+\s+passed/.test(output) &&
    !/Tests\s+\d+\s+failed/.test(output)
  );
}

function hasPassingTests(output) {
  return testsPassed(output) || /\n\s*✓\s/.test(output) || /\(\d+\s+tests?\)/.test(output);
}

function hasExplicitFailures(output) {
  return (
    /\bFAIL\b/.test(output) ||
    /Test Files\s+\d+\s+failed/.test(output) ||
    /Tests\s+\d+\s+failed/.test(output) ||
    /\n\s*[×x]\s/.test(output)
  );
}

function stripCoverageTmpUnhandledRejection(output) {
  const lines = output.split(/\r?\n/);
  const filtered = [];
  let skipping = false;

  for (const line of lines) {
    const trimmed = stripAnsi(line).trim();

    if (!skipping && trimmed.includes("Unhandled Rejection")) {
      skipping = true;
      continue;
    }

    if (skipping) {
      if (
        trimmed.startsWith("Serialized Error:") ||
        trimmed.startsWith("Error: ENOENT: no such file or directory") ||
        trimmed.startsWith("❯ open ") ||
        trimmed.startsWith("❯ Object.writeFile ") ||
        trimmed.startsWith("> open ") ||
        trimmed.startsWith("> Object.writeFile ") ||
        trimmed.includes("coverage\\.tmp") ||
        trimmed.includes("coverage/.tmp") ||
        /^[-⎯]+$/.test(trimmed) ||
        trimmed === ""
      ) {
        continue;
      }

      skipping = false;
    }

    filtered.push(line);
  }

  return filtered.join("\n").trim();
}

function runVitest() {
  rmSync(coverageDir, { recursive: true, force: true });

  return spawnSync(process.execPath, vitestArgs, {
    cwd: process.cwd(),
    stdio: "pipe",
    env: { ...process.env, FORCE_COLOR: process.env.FORCE_COLOR || "1" },
    encoding: "utf-8",
  });
}

let result = runVitest();

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

let stdout = result.stdout || "";
let stderr = result.stderr || "";
let output = `${stdout}\n${stderr}`;
let normalizedOutput = stripAnsi(output);

if ((result.status ?? 1) !== 0 && hasTransientStartupError(normalizedOutput)) {
  console.warn("Vitest coverage startup failed once, retrying...");
  result = runVitest();

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  stdout = result.stdout || "";
  stderr = result.stderr || "";
  output = `${stdout}\n${stderr}`;
  normalizedOutput = stripAnsi(output);
}

const knownCoverageTmpFailure =
  hasCoverageTmpError(normalizedOutput) &&
  hasPassingTests(normalizedOutput) &&
  !hasExplicitFailures(normalizedOutput);

if (knownCoverageTmpFailure) {
  const cleanedStdout = stripCoverageTmpUnhandledRejection(stdout);
  const cleanedStderr = stripCoverageTmpUnhandledRejection(stderr);

  if (cleanedStdout) {
    process.stdout.write(`${cleanedStdout}\n`);
  }

  if (cleanedStderr) {
    process.stderr.write(`${cleanedStderr}\n`);
  }

  process.exit(0);
}

if (stdout) {
  process.stdout.write(stdout);
}

if (stderr) {
  process.stderr.write(stderr);
}

process.exit(result.status ?? 1);
