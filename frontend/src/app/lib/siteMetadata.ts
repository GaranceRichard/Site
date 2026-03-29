import demoSnapshot from "../content/demoSnapshot.json";
import { isDemoMode } from "./demo";

export type MetadataHeader = {
  name: string;
  title: string;
};

export const DEFAULT_METADATA_HEADER: MetadataHeader = {
  name: "Garance Richard",
  title: "Coach Lean-Agile",
};

export const DEFAULT_METADATA_DESCRIPTION =
  "Accompagnement Lean-Agile pragmatique pour clarifier les priorites, stabiliser le flux et renforcer l'autonomie des equipes.";

export function getMetadataBackendOrigin(apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL): string {
  return (apiBaseUrl?.trim() || "http://127.0.0.1:8000").replace(/\/$/, "");
}

export function normalizeMetadataHeader(value: unknown): MetadataHeader {
  if (!value || typeof value !== "object") {
    return DEFAULT_METADATA_HEADER;
  }

  const candidate = value as Partial<MetadataHeader>;
  const name = typeof candidate.name === "string" ? candidate.name.trim() : "";
  const title = typeof candidate.title === "string" ? candidate.title.trim() : "";

  return {
    name: name || DEFAULT_METADATA_HEADER.name,
    title: title || DEFAULT_METADATA_HEADER.title,
  };
}

export function buildMetadataTitle(header: MetadataHeader): string {
  if (!header.title || header.title === header.name) {
    return header.name;
  }

  return `${header.name} | ${header.title}`;
}

export async function fetchMetadataHeader(): Promise<MetadataHeader> {
  if (isDemoMode()) {
    const payload = demoSnapshot as { settings?: { header?: unknown } };
    return normalizeMetadataHeader(payload.settings?.header);
  }

  try {
    const response = await fetch(`${getMetadataBackendOrigin()}/api/settings/`, {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      return DEFAULT_METADATA_HEADER;
    }

    const payload = (await response.json()) as { header?: unknown };
    return normalizeMetadataHeader(payload.header);
  } catch {
    return DEFAULT_METADATA_HEADER;
  }
}
