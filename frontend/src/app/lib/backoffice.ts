export function isBackofficeEnabled() {
  const raw = process.env.NEXT_PUBLIC_BACKOFFICE_ENABLED;
  if (!raw) return true;
  const normalized = raw.trim().toLowerCase();
  if (normalized === "false" || normalized === "0" || normalized === "off") return false;
  return true;
}
