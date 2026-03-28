/* eslint-disable @typescript-eslint/no-require-imports */
const childProcess = require("node:child_process");
const { syncBuiltinESMExports } = require("node:module");

if (process.platform === "win32") {
  const originalSpawn = childProcess.spawn.bind(childProcess);
  const originalFork = childProcess.fork.bind(childProcess);
  const maxAttempts = Number.parseInt(process.env.NODE_CHILD_PROCESS_RETRY_ATTEMPTS || "4", 10);
  const retryDelayMs = Number.parseInt(process.env.NODE_CHILD_PROCESS_RETRY_DELAY_MS || "750", 10);

  function waitBeforeRetry() {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, retryDelayMs);
  }

  function shouldRetry(error) {
    const message = String(error?.message || "");
    return /spawn(?:Sync)?(?: .*?)? EPERM/i.test(message);
  }

  function withRetries(factory, label) {
    let attempt = 1;
    while (true) {
      try {
        return factory();
      } catch (error) {
        if (!shouldRetry(error) || attempt >= maxAttempts) {
          throw error;
        }
        process.stderr.write(`${label} failed on attempt ${attempt}, retrying...\n`);
        waitBeforeRetry();
        attempt += 1;
      }
    }
  }

  childProcess.spawn = function patchedSpawn(...args) {
    return withRetries(() => originalSpawn(...args), "Node child spawn");
  };

  childProcess.fork = function patchedFork(...args) {
    return withRetries(() => originalFork(...args), "Node child fork");
  };

  syncBuiltinESMExports();
}
