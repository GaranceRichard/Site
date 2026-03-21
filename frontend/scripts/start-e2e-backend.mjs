import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(frontendDir, "..");
const backendDir = path.join(repoRoot, "backend");

const sandboxRoot = process.env.E2E_SANDBOX_ROOT || path.join(frontendDir, ".e2e-virtual");
const backendSandbox = path.join(sandboxRoot, "backend");
const databasePath = path.join(backendSandbox, "db.sqlite3");
const mediaRoot = path.join(backendSandbox, "media");

fs.mkdirSync(backendSandbox, { recursive: true });
fs.mkdirSync(mediaRoot, { recursive: true });

const backendPort = process.env.E2E_BACKEND_PORT || "8100";
const frontendPort = process.env.E2E_FRONTEND_PORT || "3100";
const frontendOrigins = [
  `http://127.0.0.1:${frontendPort}`,
  `http://localhost:${frontendPort}`,
].join(",");

const normalizedSqlitePath = databasePath.replace(/\\/g, "/");
const sqlitePath = /^[A-Za-z]:\//.test(normalizedSqlitePath)
  ? `/${normalizedSqlitePath}`
  : normalizedSqlitePath;

const backendEnv = {
  ...process.env,
  DATABASE_URL: `sqlite:///${sqlitePath}`,
  DJANGO_ALLOW_INSECURE_SECRET_KEY: "true",
  DJANGO_CORS_ALLOWED_ORIGINS: frontendOrigins,
  DJANGO_CSRF_TRUSTED_ORIGINS: frontendOrigins,
  DJANGO_ENABLE_JWT: "true",
  DJANGO_E2E_MODE: "true",
  DJANGO_MEDIA_ROOT: mediaRoot,
  E2E_BACKEND_PORT: backendPort,
};

function resolvePython() {
  const candidates = process.platform === "win32"
    ? [
        path.join(backendDir, ".venv", "Scripts", "python.exe"),
        "python",
      ]
    : [
        path.join(backendDir, ".venv", "bin", "python"),
        "python3",
        "python",
      ];

  for (const candidate of candidates) {
    if (path.isAbsolute(candidate)) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
      continue;
    }

    const probe = spawnSync(candidate, ["--version"], {
      cwd: backendDir,
      env: backendEnv,
      stdio: "ignore",
    });
    if (probe.status === 0) {
      return candidate;
    }
  }

  throw new Error("Unable to find a Python executable for the E2E backend");
}

function runPython(python, args) {
  const result = spawnSync(python, args, {
    cwd: backendDir,
    env: backendEnv,
    stdio: "inherit",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const python = resolvePython();

runPython(python, ["manage.py", "migrate", "--noinput"]);

if (process.env.E2E_ADMIN_USER && process.env.E2E_ADMIN_PASS) {
  const script = [
    "from django.contrib.auth import get_user_model",
    "import os",
    "User = get_user_model()",
    'username = os.environ["E2E_ADMIN_USER"]',
    'password = os.environ["E2E_ADMIN_PASS"]',
    'email = f"{username}@example.test"',
    "user, _ = User.objects.get_or_create(",
    "    username=username,",
    '    defaults={"email": email, "is_staff": True, "is_superuser": True},',
    ")",
    "user.email = email",
    "user.is_staff = True",
    "user.is_superuser = True",
    "user.set_password(password)",
    "user.save()",
  ].join("\n");

  runPython(python, ["manage.py", "shell", "-c", script]);
}

const server = spawn(
  python,
  ["manage.py", "runserver", `127.0.0.1:${backendPort}`, "--noreload"],
  {
    cwd: backendDir,
    env: backendEnv,
    stdio: "inherit",
  },
);

const shutdown = (signal) => {
  if (!server.killed) {
    server.kill(signal);
  }
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

server.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
