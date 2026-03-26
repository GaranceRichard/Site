"use client";

import { resolveApiBaseUrl } from "../lib/backoffice";
import {
  normalizeAboutSettings,
  normalizeHeaderSettings,
  normalizeHomeHeroSettings,
  normalizeMethodSettings,
  normalizePromiseSettings,
  normalizePublicationsSettings,
  normalizeSiteSettings,
} from "./siteSettingsNormalization";
import {
  DEFAULT_ABOUT_SETTINGS,
  DEFAULT_HEADER_SETTINGS,
  DEFAULT_HOME_HERO_SETTINGS,
  DEFAULT_METHOD_SETTINGS,
  DEFAULT_PROMISE_SETTINGS,
  DEFAULT_PUBLICATIONS_SETTINGS,
  DEFAULT_SITE_SETTINGS,
  type AboutSettings,
  type HeaderSettings,
  type HomeHeroSettings,
  type MethodSettings,
  type PromiseSettings,
  type PublicationsSettings,
  type SiteSettings,
} from "./siteSettingsSchema";

export type {
  AboutHighlight,
  AboutHighlightItem,
  AboutSettings,
  HeaderSettings,
  HeroCard,
  HeroLinkTarget,
  HeroSectionLink,
  HomeHeroSettings,
  MethodSettings,
  MethodStep,
  PromiseCard,
  PromiseSettings,
  PublicationHighlight,
  PublicationItem,
  PublicationReferenceLink,
  PublicationsSettings,
  SiteSettings,
} from "./siteSettingsSchema";

export {
  DEFAULT_ABOUT_SETTINGS,
  DEFAULT_HEADER_SETTINGS,
  DEFAULT_HOME_HERO_SETTINGS,
  DEFAULT_METHOD_SETTINGS,
  DEFAULT_PROMISE_SETTINGS,
  DEFAULT_PUBLICATIONS_SETTINGS,
};

const listeners = new Set<() => void>();
let cachedValue: SiteSettings = DEFAULT_SITE_SETTINGS;
let hasLoaded = false;
let hasLoadedFromApi = false;
let pendingLoad: Promise<SiteSettings> | null = null;

function normalizeApiBaseUrl(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.replace(/\/+$/, "");
}

function getApiBaseCandidates(): string[] {
  const resolved = normalizeApiBaseUrl(resolveApiBaseUrl());
  const envBase = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL);

  return Array.from(new Set([resolved, envBase].filter((value): value is string => Boolean(value))));
}

function notifyListeners() {
  for (const listener of listeners) {
    listener();
  }
}

function normalizeSiteSettingsForCache(next: SiteSettings): SiteSettings {
  return {
    header: normalizeHeaderSettings(next.header),
    homeHero: normalizeHomeHeroSettings(next.homeHero),
    about: normalizeAboutSettings(next.about),
    promise: normalizePromiseSettings(next.promise),
    method: normalizeMethodSettings(next.method),
    publications: normalizePublicationsSettings(next.publications),
  };
}

function setCachedSiteSettings(next: SiteSettings) {
  cachedValue = normalizeSiteSettingsForCache(next);
  hasLoaded = hasLoadedFromApi;
  notifyListeners();
}

export function getSiteSettings(): SiteSettings {
  return cachedValue;
}

export function getSiteSettingsServer(): SiteSettings {
  return DEFAULT_SITE_SETTINGS;
}

export async function ensureSiteSettingsLoaded(): Promise<SiteSettings> {
  if (typeof window === "undefined") {
    return DEFAULT_SITE_SETTINGS;
  }

  if (hasLoaded) {
    return cachedValue;
  }

  if (pendingLoad) {
    return pendingLoad;
  }

  const apiBases = getApiBaseCandidates();
  if (apiBases.length === 0) {
    return cachedValue;
  }

  pendingLoad = (async () => {
    let lastError: Error | null = null;
    try {
      for (const apiBase of apiBases) {
        try {
          const response = await fetch(`${apiBase}/api/settings/`);
          if (!response.ok) {
            throw new Error(`Erreur API (${response.status})`);
          }

          const data = (await response.json()) as unknown;
          const normalized = normalizeSiteSettings(data);
          cachedValue = normalized;
          hasLoaded = true;
          hasLoadedFromApi = true;
          notifyListeners();
          return normalized;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error("Erreur de chargement API");
        }
      }
      throw lastError ?? new Error("Erreur de chargement API");
    } catch {
      return cachedValue;
    } finally {
      pendingLoad = null;
    }
  })();

  return pendingLoad;
}

async function ensureRemoteSiteSettingsForSave(): Promise<SiteSettings> {
  if (getApiBaseCandidates().length === 0) {
    throw new Error("Configuration manquante : NEXT_PUBLIC_API_BASE_URL.");
  }
  const current = await ensureSiteSettingsLoaded();
  if (!hasLoadedFromApi) {
    throw new Error("Impossible de charger les reglages actuels. Rechargez la page puis reessayez.");
  }
  return current;
}

export async function saveSiteSettings(next: SiteSettings, token: string): Promise<SiteSettings> {
  const apiBases = getApiBaseCandidates();
  if (apiBases.length === 0) {
    throw new Error("Configuration manquante : NEXT_PUBLIC_API_BASE_URL.");
  }
  await ensureRemoteSiteSettingsForSave();

  const payload = normalizeSiteSettingsForCache(next);
  let lastError: Error | null = null;

  for (const apiBase of apiBases) {
    try {
      const response = await fetch(`${apiBase}/api/settings/admin/`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Erreur API (${response.status})`);
      }

      const data = (await response.json()) as unknown;
      const normalized = normalizeSiteSettings(data);
      cachedValue = normalized;
      hasLoaded = true;
      hasLoadedFromApi = true;
      notifyListeners();
      return normalized;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Erreur API");
    }
  }

  throw lastError ?? new Error("Erreur API");
}

type SiteSettingsSectionKey = keyof SiteSettings;

async function saveSiteSettingsSection<Key extends SiteSettingsSectionKey>(
  key: Key,
  next: SiteSettings[Key],
  token: string,
): Promise<SiteSettings> {
  const current = await ensureRemoteSiteSettingsForSave();
  return saveSiteSettings(
    {
      ...current,
      [key]: next,
    },
    token,
  );
}

function setSiteSettingsSection<Key extends SiteSettingsSectionKey>(key: Key, next: SiteSettings[Key]) {
  setCachedSiteSettings({
    ...cachedValue,
    [key]: next,
  });
}

export async function saveHeaderSettings(next: HeaderSettings, token: string): Promise<SiteSettings> {
  return saveSiteSettingsSection("header", next, token);
}

export async function saveHomeHeroSettings(
  next: HomeHeroSettings,
  token: string,
): Promise<SiteSettings> {
  return saveSiteSettingsSection("homeHero", next, token);
}

export function subscribeSiteSettings(listener: () => void) {
  listeners.add(listener);
  void ensureSiteSettingsLoaded();
  return () => {
    listeners.delete(listener);
  };
}

export function setHeaderSettings(next: HeaderSettings) {
  setSiteSettingsSection("header", next);
}

export function setHomeHeroSettings(next: HomeHeroSettings) {
  setSiteSettingsSection("homeHero", next);
}

export function replaceSiteSettings(next: SiteSettings) {
  hasLoadedFromApi = true;
  hasLoaded = true;
  setCachedSiteSettings(next);
}

export async function savePromiseSettings(next: PromiseSettings, token: string): Promise<SiteSettings> {
  return saveSiteSettingsSection("promise", next, token);
}

export function setPromiseSettings(next: PromiseSettings) {
  setSiteSettingsSection("promise", next);
}

export async function saveAboutSettings(next: AboutSettings, token: string): Promise<SiteSettings> {
  return saveSiteSettingsSection("about", next, token);
}

export function setAboutSettings(next: AboutSettings) {
  setSiteSettingsSection("about", next);
}

export async function saveMethodSettings(next: MethodSettings, token: string): Promise<SiteSettings> {
  return saveSiteSettingsSection("method", next, token);
}

export function setMethodSettings(next: MethodSettings) {
  setSiteSettingsSection("method", next);
}

export async function savePublicationsSettings(
  next: PublicationsSettings,
  token: string,
): Promise<SiteSettings> {
  return saveSiteSettingsSection("publications", next, token);
}

export function setPublicationsSettings(next: PublicationsSettings) {
  setSiteSettingsSection("publications", next);
}

export function resetSiteSettingsStoreForTests() {
  cachedValue = DEFAULT_SITE_SETTINGS;
  hasLoaded = false;
  hasLoadedFromApi = false;
  pendingLoad = null;
  listeners.clear();
}
