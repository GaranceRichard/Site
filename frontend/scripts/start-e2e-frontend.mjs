import { spawn } from "node:child_process";

const frontendPort = process.env.E2E_FRONTEND_PORT?.trim() || process.env.PORT?.trim() || "3000";
const e2eBaseUrl = process.env.E2E_BASE_URL?.trim() || `http://127.0.0.1:${frontendPort}`;
const defaultDistDir = ".next-e2e";

const env = {
  ...process.env,
  PORT: frontendPort,
  NEXT_DIST_DIR: process.env.NEXT_DIST_DIR?.trim() || defaultDistDir,
  NEXT_DEV_ALLOWED_ORIGINS:
    process.env.NEXT_DEV_ALLOWED_ORIGINS?.trim() || `${e2eBaseUrl},http://localhost:${frontendPort}`,
};

const child = spawn(
  process.execPath,
  ["./scripts/run-next.mjs", "dev", "--webpack", "--port", frontendPort],
  {
    cwd: process.cwd(),
    stdio: "inherit",
    env,
  },
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});

child.on("error", (error) => {
  console.error(error.message);
  process.exit(1);
});
