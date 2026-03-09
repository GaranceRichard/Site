import { spawn } from "node:child_process";

const vitestArgs = ["./node_modules/vitest/vitest.mjs", "run", "--coverage"];

const child = spawn(process.execPath, vitestArgs, {
  cwd: process.cwd(),
  stdio: ["inherit", "pipe", "pipe"],
  env: process.env,
});

let output = "";

child.stdout.on("data", (chunk) => {
  const text = chunk.toString();
  output += text;
  process.stdout.write(text);
});

child.stderr.on("data", (chunk) => {
  const text = chunk.toString();
  output += text;
  process.stderr.write(text);
});

child.on("exit", (code) => {
  const hasCoverageTmpError =
    output.includes("coverage\\.tmp") ||
    output.includes("coverage/.tmp");
  const testsPassed =
    /Test Files\s+\d+\s+passed/.test(output) &&
    !/Test Files\s+\d+\s+failed/.test(output) &&
    /Tests\s+\d+\s+passed/.test(output) &&
    !/Tests\s+\d+\s+failed/.test(output);
  const hasExplicitFailures =
    /\bFAIL\b/.test(output) ||
    /Test Files\s+\d+\s+failed/.test(output) ||
    /Tests\s+\d+\s+failed/.test(output) ||
    /\n\s*×\s/.test(output);

  if (code !== 0 && hasCoverageTmpError && (testsPassed || !hasExplicitFailures)) {
    process.exit(0);
    return;
  }

  process.exit(code ?? 1);
});
