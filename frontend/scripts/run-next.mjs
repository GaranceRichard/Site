import { spawn } from "node:child_process";
import childProcess from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";

const forwardedArgs = process.argv.slice(2);
const nextBin = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
const childProcessRetryPatch = path.join(process.cwd(), "scripts", "node-child-process-retry.cjs");
const childProcessRetryPatchForNodeOptions = childProcessRetryPatch.replaceAll("\\", "/");
const nextArgs = [nextBin, ...forwardedArgs];
const maxStartupAttempts = 4;
const ansiPattern = /\u001B\[[0-9;]*[A-Za-z]/g;
const require = createRequire(import.meta.url);
const originalFork = childProcess.fork.bind(childProcess);
const originalSpawn = childProcess.spawn.bind(childProcess);
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
  return output.includes("spawn EPERM") || output.includes("spawnSync") || output.includes("failed to load");
}

function waitBeforeRetry() {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 750);
}

function shouldRetrySpawnError(error) {
  if (!error) return false;
  const message = String(error.message || "");
  return /spawn(?:Sync)?(?: .*?)? EPERM/i.test(message);
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

function buildNodeOptions() {
  const existing = process.env.NODE_OPTIONS?.trim();
  const preload = `--require "${childProcessRetryPatchForNodeOptions}"`;

  if (!existing) {
    return preload;
  }

  if (existing.includes(childProcessRetryPatchForNodeOptions)) {
    return existing;
  }

  return `${preload} ${existing}`;
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

async function runNextInProcess() {
  applyNodeChildProcessRetryPatch();

  if (forwardedArgs[0] === "dev") {
    const { options, directory, portSource } = parseNextDevArgs(forwardedArgs.slice(1));
    const { nextDev } = require("next/dist/cli/next-dev.js");
    await nextDev(options, portSource, directory);
    return;
  }

  const previousArgv = process.argv;
  process.argv = [process.execPath, nextBin, ...forwardedArgs];

  try {
    require(nextBin);
  } finally {
    process.argv = previousArgv;
  }
}

function parseNextDevArgs(args) {
  const options = {
    port: 3000,
    hostname: undefined,
    disableSourceMaps: false,
    experimentalHttps: false,
    experimentalHttpsKey: undefined,
    experimentalHttpsCert: undefined,
    experimentalHttpsCa: undefined,
    experimentalUploadTrace: undefined,
    experimentalNextConfigStripTypes: false,
    inspect: undefined,
    turbo: false,
    turbopack: false,
    webpack: false,
  };

  let directory;
  let portSource = "default";

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--webpack") {
      options.webpack = true;
      continue;
    }
    if (arg === "--turbo") {
      options.turbo = true;
      continue;
    }
    if (arg === "--turbopack") {
      options.turbopack = true;
      continue;
    }
    if (arg === "--disable-source-maps") {
      options.disableSourceMaps = true;
      continue;
    }
    if (arg === "--experimental-https") {
      options.experimentalHttps = true;
      continue;
    }
    if (arg === "--experimental-next-config-strip-types") {
      options.experimentalNextConfigStripTypes = true;
      continue;
    }
    if (arg === "--port" || arg === "-p") {
      const value = args[index + 1];
      options.port = Number.parseInt(value, 10);
      portSource = "cli";
      index += 1;
      continue;
    }
    if (arg.startsWith("--port=")) {
      options.port = Number.parseInt(arg.slice("--port=".length), 10);
      portSource = "cli";
      continue;
    }
    if (arg === "--hostname" || arg === "-H") {
      options.hostname = args[index + 1];
      index += 1;
      continue;
    }
    if (arg.startsWith("--hostname=")) {
      options.hostname = arg.slice("--hostname=".length);
      continue;
    }
    if (arg === "--inspect") {
      const nextArg = args[index + 1];
      options.inspect = nextArg && !nextArg.startsWith("-") ? nextArg : true;
      if (options.inspect !== true) {
        index += 1;
      }
      continue;
    }
    if (arg.startsWith("--inspect=")) {
      options.inspect = arg.slice("--inspect=".length);
      continue;
    }
    if (arg === "--experimental-upload-trace") {
      options.experimentalUploadTrace = args[index + 1];
      index += 1;
      continue;
    }
    if (arg.startsWith("--experimental-upload-trace=")) {
      options.experimentalUploadTrace = arg.slice("--experimental-upload-trace=".length);
      continue;
    }
    if (arg === "--experimental-https-key") {
      options.experimentalHttpsKey = args[index + 1];
      index += 1;
      continue;
    }
    if (arg.startsWith("--experimental-https-key=")) {
      options.experimentalHttpsKey = arg.slice("--experimental-https-key=".length);
      continue;
    }
    if (arg === "--experimental-https-cert") {
      options.experimentalHttpsCert = args[index + 1];
      index += 1;
      continue;
    }
    if (arg.startsWith("--experimental-https-cert=")) {
      options.experimentalHttpsCert = arg.slice("--experimental-https-cert=".length);
      continue;
    }
    if (arg === "--experimental-https-ca") {
      options.experimentalHttpsCa = args[index + 1];
      index += 1;
      continue;
    }
    if (arg.startsWith("--experimental-https-ca=")) {
      options.experimentalHttpsCa = arg.slice("--experimental-https-ca=".length);
      continue;
    }
    if (!arg.startsWith("-") && !directory) {
      directory = arg;
    }
  }

  if (portSource === "default" && process.env.PORT?.trim()) {
    options.port = Number.parseInt(process.env.PORT, 10);
    portSource = "env";
  }

  return { options, directory, portSource };
}

function runNext() {
  return new Promise((resolve) => {
    let child;
    try {
      child = spawn(process.execPath, nextArgs, {
        cwd: process.cwd(),
        stdio: ["ignore", "pipe", "pipe"],
        env: {
          ...process.env,
          FORCE_COLOR: process.env.FORCE_COLOR || "1",
          NODE_OPTIONS: buildNodeOptions(),
        },
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
      const cleanedChunk = stripKnownNodeWarnings(chunk);
      stdout += cleanedChunk;
      if (cleanedChunk) {
        process.stdout.write(cleanedChunk);
      }
    });
    child.stderr?.on("data", (chunk) => {
      const cleanedChunk = stripKnownNodeWarnings(chunk);
      stderr += cleanedChunk;
      if (cleanedChunk) {
        process.stderr.write(cleanedChunk);
      }
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
let result = await runNext();

while (result.error && shouldRetrySpawnError(result.error) && attempt < maxStartupAttempts) {
  console.warn(`Next startup failed on attempt ${attempt}, retrying...`);
  waitBeforeRetry();
  attempt += 1;
  result = await runNext();
}

if (result.error) {
  if (shouldRetrySpawnError(result.error)) {
    console.warn("Next wrapper is falling back to in-process execution after repeated spawn EPERM.");
    try {
      await runNextInProcess();
      process.exit(0);
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  }
  console.error(result.error.message);
  process.exit(1);
}

let output = `${result.stdout || ""}\n${result.stderr || ""}`;
let normalizedOutput = stripAnsi(output);

while ((result.status ?? 1) !== 0 && hasTransientStartupError(normalizedOutput) && attempt < maxStartupAttempts) {
  console.warn(`Next command failed on attempt ${attempt}, retrying...`);
  waitBeforeRetry();
  attempt += 1;
  result = await runNext();

  if (result.error && !shouldRetrySpawnError(result.error)) {
    console.error(result.error.message);
    process.exit(1);
  }

  output = `${result.stdout || ""}\n${result.stderr || ""}`;
  normalizedOutput = stripAnsi(output);
}

process.exit(result.status ?? 1);
