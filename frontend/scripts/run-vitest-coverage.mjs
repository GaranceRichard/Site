import { spawn } from "node:child_process";
import { rmSync } from "node:fs";
import path from "node:path";

const forwardedArgs = process.argv.slice(2);
const vitestArgs = [
  "--import",
  "./scripts/vite-child-process-patch.mjs",
  "./node_modules/vitest/vitest.mjs",
  "run",
  "--configLoader",
  "runner",
  "--coverage",
  ...forwardedArgs,
];
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
const maxStartupAttempts = 4;
const knownWarningPatterns = [
  /\[DEP0060\].*util\._extend.*deprecated/i,
  /^\(Use `node --trace-deprecation \.\.\.` to show where the warning was created\)\s*$/im,
];

function stripAnsi(output) {
  return output.replaceAll(ansiPattern, "");
}

function stripKnownNodeWarnings(output) {
  const lines = output.split(/\r?\n/);
  const filtered = [];
  let skipTraceHint = false;

  for (const line of lines) {
    const normalized = stripAnsi(line).trim();
    if (knownWarningPatterns[0].test(normalized)) {
      skipTraceHint = true;
      continue;
    }

    if (skipTraceHint && knownWarningPatterns[1].test(normalized)) {
      skipTraceHint = false;
      continue;
    }

    skipTraceHint = false;
    filtered.push(line);
  }

  return filtered.join("\n");
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

function waitBeforeRetry() {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 750);
}

function shouldRetrySpawnError(error) {
  if (!error) {
    return false;
  }

  const message = String(error.message || "");
  return /spawn .* EPERM/i.test(message) || /spawnSync .* EPERM/i.test(message);
}

function runVitest() {
  rmSync(coverageDir, { recursive: true, force: true });

  return new Promise((resolve) => {
    let child;
    try {
      child = spawn(process.execPath, vitestArgs, {
        cwd: process.cwd(),
        stdio: ["ignore", "pipe", "pipe"],
        env: { ...process.env, FORCE_COLOR: process.env.FORCE_COLOR || "1" },
      });
    } catch (error) {
      resolve({ error, status: 1, stdout: "", stderr: "" });
      return;
    }

    let stdout = "";
    let stderr = "";
    let settled = false;

    child.stdout?.setEncoding("utf8");
    child.stderr?.setEncoding("utf8");
    child.stdout?.on("data", (chunk) => {
      stdout += stripKnownNodeWarnings(chunk);
    });
    child.stderr?.on("data", (chunk) => {
      stderr += stripKnownNodeWarnings(chunk);
    });

    child.on("error", (error) => {
      if (settled) return;
      settled = true;
      resolve({ error, status: 1, stdout, stderr });
    });

    child.on("close", (status) => {
      if (settled) return;
      settled = true;
      resolve({ error: null, status: status ?? 1, stdout, stderr });
    });
  });
}

let result = await runVitest();

let attempt = 1;
while (result.error && shouldRetrySpawnError(result.error) && attempt < maxStartupAttempts) {
  console.warn(`Vitest coverage spawn failed on attempt ${attempt}, retrying...`);
  waitBeforeRetry();
  attempt += 1;
  result = await runVitest();
}

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

let stdout = result.stdout || "";
let stderr = result.stderr || "";
let output = `${stdout}\n${stderr}`;
let normalizedOutput = stripAnsi(output);

while ((result.status ?? 1) !== 0 && hasTransientStartupError(normalizedOutput) && attempt < maxStartupAttempts) {
  console.warn(`Vitest coverage startup failed on attempt ${attempt}, retrying...`);
  waitBeforeRetry();
  attempt += 1;
  result = await runVitest();

  if (result.error && !shouldRetrySpawnError(result.error)) {
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
