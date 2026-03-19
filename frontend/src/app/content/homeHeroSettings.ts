"use client";

import {
  DEFAULT_HOME_HERO_SETTINGS,
  getSiteSettings,
  getSiteSettingsServer,
  setHomeHeroSettings,
  subscribeSiteSettings,
  type HeroCard,
  type HeroLinkTarget,
  type HeroSectionLink,
  type HomeHeroSettings,
} from "./siteSettingsStore";

export type { HeroCard, HeroLinkTarget, HeroSectionLink, HomeHeroSettings };
export { DEFAULT_HOME_HERO_SETTINGS, setHomeHeroSettings };

export function getHomeHeroSettings(): HomeHeroSettings {
  return getSiteSettings().homeHero;
}

export function getHomeHeroSettingsServer(): HomeHeroSettings {
  return getSiteSettingsServer().homeHero;
}

export function subscribeHomeHeroSettings(listener: () => void) {
  return subscribeSiteSettings(listener);
}
