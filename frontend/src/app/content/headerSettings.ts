"use client";

import {
  DEFAULT_HEADER_SETTINGS,
  getSiteSettings,
  getSiteSettingsServer,
  setHeaderSettings,
  subscribeSiteSettings,
  type HeaderSettings,
} from "./siteSettingsStore";

export type { HeaderSettings };
export { DEFAULT_HEADER_SETTINGS, setHeaderSettings };

export function getHeaderSettings(): HeaderSettings {
  return getSiteSettings().header;
}

export function getHeaderSettingsServer(): HeaderSettings {
  return getSiteSettingsServer().header;
}

export function subscribeHeaderSettings(listener: () => void) {
  return subscribeSiteSettings(listener);
}
