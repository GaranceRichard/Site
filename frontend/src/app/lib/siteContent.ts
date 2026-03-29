import { cache } from "react";

import demoSnapshot from "../content/demoSnapshot.json";
import { resolveApiBaseUrl } from "./backoffice";
import { isDemoMode } from "./demo";
import type { ApiReference } from "./references";

export type PublicationReferenceLink = {
  id: string;
  title: string;
  url: string;
};

export type PublicationPageEntry = {
  id: string;
  title: string;
  content: string;
  links: PublicationReferenceLink[];
  slug: string;
  excerpt: string;
};

export type PublicationPageSettings = {
  title: string;
  subtitle: string;
  highlight: {
    title: string;
    content: string;
  };
};

export type ReferencePageEntry = ApiReference & {
  slug: string;
  excerpt: string;
};

type DemoSnapshotPayload = {
  settings?: {
    publications?: {
      title?: unknown;
      subtitle?: unknown;
      highlight?: {
        title?: unknown;
        content?: unknown;
      };
      items?: unknown;
    };
  };
  references?: unknown;
};

type PublicationSettingsRaw = NonNullable<DemoSnapshotPayload["settings"]>["publications"];

const rawSnapshot = demoSnapshot as DemoSnapshotPayload;

function normalizeString(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, "")
    .toLowerCase();
}

export function slugifySegment(value: string): string {
  const normalized = normalizeString(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "item";
}

function buildExcerpt(value: string, maxLength = 180): string {
  const compact = value.replace(/\s+/g, " ").trim();
  if (compact.length <= maxLength) {
    return compact;
  }

  return `${compact.slice(0, maxLength).trimEnd()}...`;
}

function asTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePublicationLinks(value: unknown): PublicationReferenceLink[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item, index) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const candidate = item as Partial<PublicationReferenceLink>;
      const title = asTrimmedString(candidate.title);
      const url = asTrimmedString(candidate.url);

      if (!title || !url) {
        return null;
      }

      return {
        id: asTrimmedString(candidate.id) || `publication-link-${index + 1}`,
        title,
        url,
      };
    })
    .filter((item): item is PublicationReferenceLink => Boolean(item));
}

function normalizePublicationItems(value: unknown): PublicationPageEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item, index) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const candidate = item as {
        id?: unknown;
        title?: unknown;
        content?: unknown;
        links?: unknown;
      };
      const title = asTrimmedString(candidate.title);
      const content = asTrimmedString(candidate.content);
      const id = asTrimmedString(candidate.id) || `publication-${index + 1}`;

      if (!title || !content) {
        return null;
      }

      return {
        id,
        title,
        content,
        links: normalizePublicationLinks(candidate.links),
        slug: `${slugifySegment(title || id)}-${index + 1}`,
        excerpt: buildExcerpt(content),
      };
    })
    .filter((item): item is PublicationPageEntry => Boolean(item));
}

function normalizePublicationSettings(value: unknown): PublicationPageSettings {
  const candidate = value && typeof value === "object" ? value : {};
  const typedCandidate = candidate as PublicationSettingsRaw;

  return {
    title: asTrimmedString(typedCandidate?.title) || "Publications",
    subtitle: asTrimmedString(typedCandidate?.subtitle),
    highlight: {
      title: asTrimmedString(typedCandidate?.highlight?.title),
      content: asTrimmedString(typedCandidate?.highlight?.content),
    },
  };
}

function normalizeReferenceEntries(value: unknown): ReferencePageEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map<ReferencePageEntry | null>((item, index) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const candidate = item as Partial<ApiReference>;
      const id = typeof candidate.id === "number" ? candidate.id : index + 1;
      const reference = asTrimmedString(candidate.reference);

      if (!reference) {
        return null;
      }

      const orderIndex = typeof candidate.order_index === "number" ? candidate.order_index : index + 1;
      const situation = asTrimmedString(candidate.situation);
      const results = Array.isArray(candidate.results)
        ? candidate.results.filter((result): result is string => typeof result === "string" && result.trim().length > 0)
        : [];

      return {
        id,
        reference,
        reference_short: asTrimmedString(candidate.reference_short),
        order_index: orderIndex,
        image: asTrimmedString(candidate.image),
        image_thumb: asTrimmedString(candidate.image_thumb) || undefined,
        icon: asTrimmedString(candidate.icon),
        situation,
        tasks: Array.isArray(candidate.tasks)
          ? candidate.tasks.filter((task): task is string => typeof task === "string" && task.trim().length > 0)
          : [],
        actions: Array.isArray(candidate.actions)
          ? candidate.actions.filter((action): action is string => typeof action === "string" && action.trim().length > 0)
          : [],
        results,
        slug: `${slugifySegment(reference)}-${id}`,
        excerpt: buildExcerpt(situation || results[0] || ""),
      };
    })
    .filter((item): item is ReferencePageEntry => item !== null)
    .sort((left, right) => left.order_index - right.order_index);
}

const fetchPublicationsPayload = cache(async (): Promise<{
  settings: PublicationPageSettings;
  items: PublicationPageEntry[];
}> => {
  if (isDemoMode()) {
    return {
      settings: normalizePublicationSettings(rawSnapshot.settings?.publications),
      items: normalizePublicationItems(rawSnapshot.settings?.publications?.items),
    };
  }

  const apiBase = resolveApiBaseUrl();
  if (!apiBase) {
    return { settings: normalizePublicationSettings(null), items: [] };
  }

  try {
    const response = await fetch(`${apiBase}/api/settings/`, {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      return { settings: normalizePublicationSettings(null), items: [] };
    }

    const payload = (await response.json()) as { publications?: unknown };
    return {
      settings: normalizePublicationSettings(payload.publications),
      items: normalizePublicationItems((payload.publications as { items?: unknown } | undefined)?.items),
    };
  } catch {
    return { settings: normalizePublicationSettings(null), items: [] };
  }
});

const fetchReferencesPayload = cache(async (): Promise<ReferencePageEntry[]> => {
  if (isDemoMode()) {
    return normalizeReferenceEntries(rawSnapshot.references);
  }

  const apiBase = resolveApiBaseUrl();
  if (!apiBase) {
    return [];
  }

  try {
    const response = await fetch(`${apiBase}/api/contact/references`, {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as unknown;
    return normalizeReferenceEntries(payload);
  } catch {
    return [];
  }
});

export async function getPublicationPageSettings(): Promise<PublicationPageSettings> {
  return (await fetchPublicationsPayload()).settings;
}

export async function getPublicationsPageEntries(): Promise<PublicationPageEntry[]> {
  return (await fetchPublicationsPayload()).items;
}

export async function getPublicationPageEntryBySlug(
  slug: string,
): Promise<PublicationPageEntry | null> {
  const entries = await getPublicationsPageEntries();
  return entries.find((item) => item.slug === slug) ?? null;
}

export async function getReferencePageEntries(): Promise<ReferencePageEntry[]> {
  return fetchReferencesPayload();
}

export async function getReferencePageEntryBySlug(slug: string): Promise<ReferencePageEntry | null> {
  const entries = await getReferencePageEntries();
  return entries.find((item) => item.slug === slug) ?? null;
}
