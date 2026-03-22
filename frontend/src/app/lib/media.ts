export function toProxiedMediaUrl(rawUrl: string | null | undefined): string {
  const trimmed = rawUrl?.trim() ?? "";
  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("/media/")) {
    return `/api-proxy${trimmed}`;
  }

  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    if (!parsed.pathname.startsWith("/media/")) {
      return trimmed;
    }
    return `/api-proxy${parsed.pathname}${parsed.search}`;
  } catch {
    return trimmed;
  }
}
