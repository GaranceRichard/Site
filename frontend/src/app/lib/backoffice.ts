export function isBackofficeEnabled() {
  const raw = process.env.NEXT_PUBLIC_BACKOFFICE_ENABLED;
  if (!raw) return true;
  const normalized = raw.trim().toLowerCase();
  if (normalized === "false" || normalized === "0" || normalized === "off") return false;
  return true;
}

function decodeBase64Url(payload: string): string {
  const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");

  if (typeof atob === "function") {
    return atob(padded);
  }

  return Buffer.from(padded, "base64").toString("utf-8");
}

export function isAccessTokenValid(token: string | null): boolean {
  if (!token) return false;

  const parts = token.split(".");
  if (parts.length < 2) return false;

  try {
    const payloadJson = decodeBase64Url(parts[1]);
    const payload = JSON.parse(payloadJson) as { exp?: number };
    if (typeof payload.exp !== "number") return true;
    return Date.now() / 1000 < payload.exp;
  } catch {
    return false;
  }
}
