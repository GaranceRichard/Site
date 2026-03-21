import path from "node:path";
const frontendDir = path.resolve(process.cwd());

export const DEFAULT_E2E_FRONTEND_PORT = 3100;
export const DEFAULT_E2E_BACKEND_PORT = 8100;
export const DEFAULT_E2E_HOST = "127.0.0.1";

type EnvSource = Record<string, string | undefined>;

function readNumber(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readText(value: string | undefined) {
  return value?.trim() || undefined;
}

function isUnsafeDevPort(port: number) {
  return port === 3000 || port === 8000;
}

function normalizeSqlitePath(filePath: string) {
  const normalized = filePath.replace(/\\/g, "/");
  return /^[A-Za-z]:\//.test(normalized) ? `/${normalized}` : normalized;
}

export function getE2EPorts(env: EnvSource = process.env) {
  const rawFrontendPort = readNumber(env.E2E_FRONTEND_PORT, DEFAULT_E2E_FRONTEND_PORT);
  const rawBackendPort = readNumber(env.E2E_BACKEND_PORT, DEFAULT_E2E_BACKEND_PORT);
  const frontendPort = isUnsafeDevPort(rawFrontendPort)
    ? DEFAULT_E2E_FRONTEND_PORT
    : rawFrontendPort;
  const backendPort = isUnsafeDevPort(rawBackendPort)
    ? DEFAULT_E2E_BACKEND_PORT
    : rawBackendPort;

  return { frontendPort, backendPort };
}

export function getE2EUrls(env: EnvSource = process.env) {
  const { frontendPort, backendPort } = getE2EPorts(env);

  return {
    frontendPort,
    backendPort,
    baseURL: `http://${DEFAULT_E2E_HOST}:${frontendPort}`,
    apiBaseURL: `http://${DEFAULT_E2E_HOST}:${backendPort}`,
  };
}

export function getE2EPaths(env: EnvSource = process.env) {
  const sandboxRoot =
    readText(env.E2E_SANDBOX_ROOT) || path.join(frontendDir, ".e2e-virtual");
  const backendRoot = path.join(sandboxRoot, "backend");

  return {
    frontendDir,
    sandboxRoot,
    backendRoot,
    djangoDatabasePath: path.join(backendRoot, "db.sqlite3"),
    djangoMediaRoot: path.join(backendRoot, "media"),
  };
}

export function getE2EBackendEnv(env: EnvSource = process.env) {
  const urls = getE2EUrls(env);
  const paths = getE2EPaths(env);
  const allowedFrontendOrigins = [
    urls.baseURL,
    `http://127.0.0.1:${urls.frontendPort}`,
    `http://localhost:${urls.frontendPort}`,
  ];

  return {
    DATABASE_URL: `sqlite:///${normalizeSqlitePath(paths.djangoDatabasePath)}`,
    DJANGO_ALLOW_INSECURE_SECRET_KEY: "true",
    DJANGO_CORS_ALLOWED_ORIGINS: allowedFrontendOrigins.join(","),
    DJANGO_CSRF_TRUSTED_ORIGINS: allowedFrontendOrigins.join(","),
    DJANGO_E2E_MODE: "true",
    DJANGO_ENABLE_JWT: "true",
    DJANGO_MEDIA_ROOT: paths.djangoMediaRoot,
  };
}
