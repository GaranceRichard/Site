function isTruthyFlag(value: string | undefined): boolean {
  const normalized = value?.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

export function isDemoMode(): boolean {
  return isTruthyFlag(process.env.NEXT_PUBLIC_DEMO_MODE);
}

export function getBasePath(): string {
  const raw = process.env.NEXT_PUBLIC_BASE_PATH?.trim() ?? "";
  if (!raw) {
    return "";
  }

  const normalized = raw.startsWith("/") ? raw : `/${raw}`;
  return normalized.replace(/\/+$/, "");
}

export function withBasePath(path: string): string {
  if (!path.startsWith("/")) {
    return path;
  }

  const basePath = getBasePath();
  if (!basePath || path === "/") {
    return basePath || path;
  }

  return `${basePath}${path}`;
}
