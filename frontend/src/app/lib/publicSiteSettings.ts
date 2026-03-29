import { cache } from "react";

import { getDemoSiteSettings } from "../content/demoSnapshot";
import { normalizeSiteSettings } from "../content/siteSettingsNormalization";
import { resolveApiBaseUrl } from "./backoffice";
import { isDemoMode } from "./demo";

import type { SiteSettings } from "../content/siteSettingsSchema";

export const fetchPublicSiteSettings = cache(async (): Promise<SiteSettings> => {
  if (isDemoMode()) {
    return getDemoSiteSettings();
  }

  const apiBase = resolveApiBaseUrl();
  if (!apiBase) {
    return normalizeSiteSettings(null);
  }

  try {
    const response = await fetch(`${apiBase}/api/settings/`, {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      return normalizeSiteSettings(null);
    }

    return normalizeSiteSettings((await response.json()) as unknown);
  } catch {
    return normalizeSiteSettings(null);
  }
});
