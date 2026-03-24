"use client";

import {
  DEFAULT_ABOUT_SETTINGS,
  getSiteSettings,
  getSiteSettingsServer,
  setAboutSettings,
  subscribeSiteSettings,
  type AboutHighlight,
  type AboutHighlightItem,
  type AboutSettings,
} from "./siteSettingsStore";

export type { AboutHighlight, AboutHighlightItem, AboutSettings };
export { DEFAULT_ABOUT_SETTINGS, setAboutSettings };

export function getAboutSettings(): AboutSettings {
  return getSiteSettings().about;
}

export function getAboutSettingsServer(): AboutSettings {
  return getSiteSettingsServer().about;
}

export function subscribeAboutSettings(listener: () => void) {
  return subscribeSiteSettings(listener);
}
