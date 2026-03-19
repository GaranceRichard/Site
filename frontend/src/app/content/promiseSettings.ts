"use client";

import {
  DEFAULT_PROMISE_SETTINGS,
  getSiteSettings,
  getSiteSettingsServer,
  setPromiseSettings,
  subscribeSiteSettings,
  type PromiseCard,
  type PromiseSettings,
} from "./siteSettingsStore";

export type { PromiseCard, PromiseSettings };
export { DEFAULT_PROMISE_SETTINGS, setPromiseSettings };

export function getPromiseSettings(): PromiseSettings {
  return getSiteSettings().promise;
}

export function getPromiseSettingsServer(): PromiseSettings {
  return getSiteSettingsServer().promise;
}

export function subscribePromiseSettings(listener: () => void) {
  return subscribeSiteSettings(listener);
}
