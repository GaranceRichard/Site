"use client";

import { createContext, useContext, useEffect } from "react";

import { replaceSiteSettings } from "../content/siteSettingsStore";

import type { SiteSettings } from "../content/siteSettingsStore";

const SiteSettingsContext = createContext<SiteSettings | null>(null);

export function useInitialSiteSettings(): SiteSettings | null {
  return useContext(SiteSettingsContext);
}

export default function SiteSettingsProvider({
  initialSettings,
  children,
}: {
  initialSettings: SiteSettings;
  children: React.ReactNode;
}) {
  useEffect(() => {
    replaceSiteSettings(initialSettings);
  }, [initialSettings]);

  return <SiteSettingsContext.Provider value={initialSettings}>{children}</SiteSettingsContext.Provider>;
}
