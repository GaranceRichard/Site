import { normalizeSiteSettings } from "./siteSettingsNormalization";
import type { SiteSettings } from "./siteSettingsSchema";
import snapshot from "./demoSnapshot.json";

type DemoSnapshotReference = {
  id: number;
  reference: string;
  reference_short: string;
  order_index: number;
  image: string;
  image_thumb?: string;
  icon: string;
  situation: string;
  tasks: string[];
  actions: string[];
  results: string[];
};

type DemoSnapshotPayload = {
  settings?: unknown;
  references?: DemoSnapshotReference[];
};

const rawSnapshot = snapshot as DemoSnapshotPayload;

function normalizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

const demoSiteSettings = normalizeSiteSettings(rawSnapshot.settings);
const demoReferences = Array.isArray(rawSnapshot.references)
  ? rawSnapshot.references
      .map((item, index) => ({
        id: Number.isFinite(item.id) ? item.id : index + 1,
        reference: String(item.reference ?? "").trim(),
        reference_short: String(item.reference_short ?? "").trim(),
        order_index: Number.isFinite(item.order_index) ? item.order_index : index + 1,
        image: String(item.image ?? "").trim(),
        image_thumb: String(item.image_thumb ?? "").trim(),
        icon: String(item.icon ?? "").trim(),
        situation: String(item.situation ?? "").trim(),
        tasks: normalizeStringList(item.tasks),
        actions: normalizeStringList(item.actions),
        results: normalizeStringList(item.results),
      }))
      .filter((item) => item.reference)
      .sort((left, right) => left.order_index - right.order_index)
  : [];

export function getDemoSiteSettings(): SiteSettings {
  return demoSiteSettings;
}

export function getDemoReferences(): DemoSnapshotReference[] {
  return demoReferences;
}
