import { spawn } from "node:child_process";
import path from "node:path";

const forwardedArgs = process.argv.slice(2);
const shouldSerializeWorkersOnWindows =
  process.platform === "win32" &&
  forwardedArgs[0] === "test" &&
  !forwardedArgs.includes("--workers") &&
  !forwardedArgs.some((arg) => arg.startsWith("--workers="));
const resolvedArgs = shouldSerializeWorkersOnWindows ? [...forwardedArgs, "--workers=1"] : forwardedArgs;
const playwrightCli = path.join(process.cwd(), "node_modules", "@playwright", "test", "cli.js");
const playwrightArgs = [playwrightCli, ...resolvedArgs];
const maxStartupAttempts = 4;
const ansiPattern = /\u001B\[[0-9;]*[A-Za-z]/g;

function stripAnsi(output) {
  return output.replaceAll(ansiPattern, "");
}

function hasTransientStartupError(output) {
  return (
    output.includes("Error: spawn EPERM") ||
    output.includes("spawn EPERM") ||
    output.includes("spawnSync") ||
    output.includes("webServer exited")
  );
}

function waitBeforeRetry() {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 750);
}

function shouldRetrySpawnError(error) {
  if (!error) return false;
  const message = String(error.message || "");
  return /spawn(?:Sync)?(?: .*?)? EPERM/i.test(message);
}

function runPlaywright() {
  return new Promise((resolve) => {
    let child;
    try {
      child = spawn(process.execPath, playwrightArgs, {
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
      stdout += chunk;
    });
    child.stderr?.on("data", (chunk) => {
      stderr += chunk;
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

let attempt = 1;
let result = await runPlaywright();

while (result.error && shouldRetrySpawnError(result.error) && attempt < maxStartupAttempts) {
  console.warn(`Playwright startup failed on attempt ${attempt}, retrying...`);
  waitBeforeRetry();
  attempt += 1;
  result = await runPlaywright();
}

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

let output = `${result.stdout || ""}\n${result.stderr || ""}`;
let normalizedOutput = stripAnsi(output);

while ((result.status ?? 1) !== 0 && hasTransientStartupError(normalizedOutput) && attempt < maxStartupAttempts) {
  console.warn(`Playwright command failed on attempt ${attempt}, retrying...`);
  waitBeforeRetry();
  attempt += 1;
  result = await runPlaywright();

  if (result.error && !shouldRetrySpawnError(result.error)) {
    console.error(result.error.message);
    process.exit(1);
  }

  output = `${result.stdout || ""}\n${result.stderr || ""}`;
  normalizedOutput = stripAnsi(output);
}

if (result.stdout) {
  process.stdout.write(result.stdout);
}

if (result.stderr) {
  process.stderr.write(result.stderr);
}

process.exit(result.status ?? 1);
