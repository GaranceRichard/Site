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

function sortByOrderIndex(items: ApiReference[]): ApiReference[] {
  return items.slice().sort((a, b) => a.order_index - b.order_index);
}

export async function fetchReferencesOnce(): Promise<ApiReference[]> {
  if (cachedReferences) {
    return cachedReferences;
  }
  if (pendingReferencesRequest) {
    return pendingReferencesRequest;
  }

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
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
