import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "..");
const backendDir = path.join(rootDir, "backend");
const snapshotPath = path.join(
  rootDir,
  "frontend",
  "src",
  "app",
  "content",
  "demoSnapshot.json",
);

function commandExists(command) {
  const probe = process.platform === "win32" ? "where" : "which";
  const result = spawnSync(probe, [command], { stdio: "ignore" });

  return result.status === 0;
}

function resolvePython() {
  const candidates =
    process.platform === "win32"
      ? [
          path.join(backendDir, ".venv", "Scripts", "python.exe"),
          process.env.PYTHON,
          "py",
          "python",
        ]
      : [
          path.join(backendDir, ".venv", "bin", "python"),
          process.env.PYTHON,
          "python3",
          "python",
        ];

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    if (path.isAbsolute(candidate)) {
      if (existsSync(candidate)) {
        return candidate;
      }
      continue;
    }

    if (commandExists(candidate)) {
      return candidate;
    }
  }

  throw new Error("Python interpreter not found for demo snapshot export.");
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: false,
  });

  if (result.error) {
    throw result.error;
  }

  if (typeof result.status === "number" && result.status !== 0) {
    process.exit(result.status);
  }
}

function main() {
  const python = resolvePython();
  const pythonArgs =
    process.platform === "win32" && path.basename(python).toLowerCase() === "py"
      ? ["-3", "manage.py", "export_demo_snapshot"]
      : ["manage.py", "export_demo_snapshot"];

  run(python, pythonArgs, backendDir);
  run("git", ["add", snapshotPath], rootDir);
}

main();
