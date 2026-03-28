import childProcess, { spawn } from "node:child_process";
import path from "node:path";
import { createRequire } from "node:module";

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
const require = createRequire(import.meta.url);
const originalSpawn = childProcess.spawn.bind(childProcess);
const originalFork = childProcess.fork.bind(childProcess);
const e2eBackendScript = path.join(process.cwd(), "scripts", "start-e2e-backend.mjs");
const e2eFrontendScript = path.join(process.cwd(), "scripts", "start-e2e-frontend.mjs");
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

async function waitForUrl(url, timeoutMs = 120_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { method: "GET" });
      if (response.ok || response.status < 500) {
        return;
      }
    } catch {
      // retry
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function killChild(child, signal = "SIGTERM") {
  if (!child || child.killed) {
    return;
  }
  try {
    child.kill(signal);
  } catch {
    // noop
  }
}

async function startManagedServer(label, scriptPath, readyUrl, env) {
  const child = withSpawnRetries(
    () =>
      originalSpawn(process.execPath, [scriptPath], {
        cwd: process.cwd(),
        stdio: ["ignore", "pipe", "pipe"],
        env,
      }),
    `${label} startup`,
  );

  let stdout = "";
  let stderr = "";
  child.stdout?.setEncoding("utf8");
  child.stderr?.setEncoding("utf8");
  child.stdout?.on("data", (chunk) => {
    stdout += chunk;
    const cleanedChunk = stripKnownNodeWarnings(chunk);
    if (cleanedChunk) {
      process.stdout.write(cleanedChunk);
    }
  });
  child.stderr?.on("data", (chunk) => {
    stderr += chunk;
    const cleanedChunk = stripKnownNodeWarnings(chunk);
    if (cleanedChunk) {
      process.stderr.write(cleanedChunk);
    }
  });

  const exitPromise = new Promise((_, reject) => {
    child.once("exit", (code, signal) => {
      reject(
        new Error(
          `${label} exited before becoming ready (code=${code ?? "null"}, signal=${signal ?? "null"})\n${stdout}\n${stderr}`,
        ),
      );
    });
  });

  await Promise.race([waitForUrl(readyUrl), exitPromise]);
  return child;
}

async function startManagedE2EServersIfNeeded() {
  if (process.platform !== "win32" || !resolvedArgs.includes("test")) {
    return null;
  }

  const frontendPort = process.env.E2E_FRONTEND_PORT?.trim() || "3100";
  const backendPort = process.env.E2E_BACKEND_PORT?.trim() || "8100";
  const backendBaseUrl = process.env.E2E_API_BASE_URL?.trim() || `http://127.0.0.1:${backendPort}`;
  const backendUrl = `${backendBaseUrl.replace(/\/$/, "")}/api/health`;
  const frontendUrl = process.env.E2E_BASE_URL?.trim() || `http://127.0.0.1:${frontendPort}`;
  const sharedEnv = {
    ...process.env,
    E2E_FRONTEND_PORT: frontendPort,
    E2E_BACKEND_PORT: backendPort,
    E2E_BASE_URL: frontendUrl,
    E2E_API_BASE_URL: backendBaseUrl,
    NEXT_PUBLIC_API_BASE_URL: backendBaseUrl,
    PW_E2E_REUSE_EXISTING_SERVER: "1",
    FORCE_COLOR: process.env.FORCE_COLOR || "1",
  };

  const backendChild = await startManagedServer("E2E backend", e2eBackendScript, backendUrl, sharedEnv);
  try {
    const frontendChild = await startManagedServer(
      "E2E frontend",
      e2eFrontendScript,
      frontendUrl,
      sharedEnv,
    );
    return {
      env: sharedEnv,
      dispose() {
        killChild(frontendChild);
        killChild(backendChild);
      },
    };
  } catch (error) {
    killChild(backendChild);
    throw error;
  }
}

function withSpawnRetries(factory, label) {
  let attempt = 1;
  while (true) {
    try {
      return factory();
    } catch (error) {
      if (!shouldRetrySpawnError(error) || attempt >= maxStartupAttempts) {
        throw error;
      }
      console.warn(`${label} failed on attempt ${attempt}, retrying...`);
      waitBeforeRetry();
      attempt += 1;
    }
  }
}

function applyNodeChildProcessRetryPatch() {
  if (process.platform !== "win32") {
    return;
  }

  childProcess.spawn = function patchedSpawn(...args) {
    return withSpawnRetries(() => originalSpawn(...args), "Node child spawn");
  };

  childProcess.fork = function patchedFork(...args) {
    return withSpawnRetries(() => originalFork(...args), "Node child fork");
  };
}

async function runPlaywrightInProcess() {
  const previousArgv = process.argv;
  process.argv = [process.execPath, playwrightCli, ...resolvedArgs];

  try {
    applyNodeChildProcessRetryPatch();
    const { program } = require("playwright/lib/program");
    await program.parseAsync(process.argv);
  } finally {
    process.argv = previousArgv;
  }
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

let attempt = 1;
let managedServers;
try {
  managedServers = await startManagedE2EServersIfNeeded();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

if (managedServers?.env) {
  process.env.PW_E2E_REUSE_EXISTING_SERVER = managedServers.env.PW_E2E_REUSE_EXISTING_SERVER;
}

let result = await runPlaywright();

while (result.error && shouldRetrySpawnError(result.error) && attempt < maxStartupAttempts) {
  console.warn(`Playwright startup failed on attempt ${attempt}, retrying...`);
  waitBeforeRetry();
  attempt += 1;
  result = await runPlaywright();
}

if (result.error) {
  if (shouldRetrySpawnError(result.error)) {
    console.warn("Playwright wrapper is falling back to in-process execution after repeated spawn EPERM.");
    try {
      await runPlaywrightInProcess();
      managedServers?.dispose();
      process.exit(0);
    } catch (error) {
      managedServers?.dispose();
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  }
  managedServers?.dispose();
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
    managedServers?.dispose();
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

managedServers?.dispose();
process.exit(result.status ?? 1);
