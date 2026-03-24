"use client";

import {
  DEFAULT_PUBLICATIONS_SETTINGS,
  getSiteSettings,
  getSiteSettingsServer,
  setPublicationsSettings,
  subscribeSiteSettings,
  type PublicationHighlight,
  type PublicationItem,
  type PublicationReferenceLink,
  type PublicationsSettings,
} from "./siteSettingsStore";

export type {
  PublicationHighlight,
  PublicationItem,
  PublicationReferenceLink,
  PublicationsSettings,
};
export { DEFAULT_PUBLICATIONS_SETTINGS, setPublicationsSettings };

export function getPublicationsSettings(): PublicationsSettings {
  return getSiteSettings().publications;
}

export function getPublicationsSettingsServer(): PublicationsSettings {
  return getSiteSettingsServer().publications;
}

export function subscribePublicationsSettings(listener: () => void) {
  return subscribeSiteSettings(listener);
}
