import { REFERENCES } from "../content/references";
import { resolveApiBaseUrl } from "./backoffice";
import { isDemoMode } from "./demo";

export type ApiReference = {
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

let cachedReferences: ApiReference[] | null = null;
let pendingReferencesRequest: Promise<ApiReference[]> | null = null;

function getDemoReferences(): ApiReference[] {
  return REFERENCES.map((item, index) => ({
    id: index + 1,
    reference: item.nameExpanded,
    reference_short: item.nameCollapsed,
    order_index: index + 1,
    image: item.imageSrc,
    image_thumb: item.imageSrc,
    icon: item.badgeSrc ?? "",
    situation: item.situation,
    tasks: item.tasks,
    actions: item.actions,
    results: item.results,
  }));
}

function sortByOrderIndex(items: ApiReference[]): ApiReference[] {
  return items.slice().sort((a, b) => a.order_index - b.order_index);
}

export async function fetchReferencesOnce(): Promise<ApiReference[]> {
  if (isDemoMode()) {
    cachedReferences ??= sortByOrderIndex(getDemoReferences());
    return cachedReferences;
  }

  if (cachedReferences) {
    return cachedReferences;
  }
  if (pendingReferencesRequest) {
    return pendingReferencesRequest;
  }

  const apiBase = resolveApiBaseUrl();
  if (!apiBase) {
    throw new Error("Configuration manquante : NEXT_PUBLIC_API_BASE_URL.");
  }

  pendingReferencesRequest = (async () => {
    const res = await fetch(`${apiBase}/api/contact/references`);
    if (!res.ok) {
      throw new Error(`Erreur API (${res.status})`);
    }

    const data = (await res.json()) as unknown;
    const list = Array.isArray(data) ? (data as ApiReference[]) : [];
    cachedReferences = sortByOrderIndex(list);
    return cachedReferences;
  })().finally(() => {
    pendingReferencesRequest = null;
  });

  return pendingReferencesRequest;
}

export function invalidateReferencesCache(): void {
  cachedReferences = null;
  pendingReferencesRequest = null;
}
