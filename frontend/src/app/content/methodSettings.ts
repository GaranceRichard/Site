"use client";

import {
  DEFAULT_METHOD_SETTINGS,
  getSiteSettings,
  getSiteSettingsServer,
  setMethodSettings,
  subscribeSiteSettings,
  type MethodSettings,
  type MethodStep,
} from "./siteSettingsStore";

export type { MethodSettings, MethodStep };
export { DEFAULT_METHOD_SETTINGS, setMethodSettings };

export function getMethodSettings(): MethodSettings {
  return getSiteSettings().method;
}

export function getMethodSettingsServer(): MethodSettings {
  return getSiteSettingsServer().method;
}

export function subscribeMethodSettings(listener: () => void) {
  return subscribeSiteSettings(listener);
}
