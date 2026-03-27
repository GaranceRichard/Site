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

export function toDemoAssetUrl(rawPath: string | null | undefined): string {
  const trimmed = rawPath?.trim() ?? "";
  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.pathname.startsWith("/media/")) {
        return withBasePath(`/demo-media${parsed.pathname.slice("/media".length)}${parsed.search}`);
      }
      return trimmed;
    } catch {
      return trimmed;
    }
  }

  if (trimmed.startsWith("/media/")) {
    return withBasePath(`/demo-media${trimmed.slice("/media".length)}`);
  }

  if (trimmed.startsWith("/")) {
    return withBasePath(trimmed);
  }

  return withBasePath(`/demo-media/${trimmed.replace(/^\/+/, "")}`);
}
