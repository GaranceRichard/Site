export function clearAuthTokens(storage?: Pick<Storage, "removeItem">): void {
  const target = storage ?? sessionStorage;
  try {
    target.removeItem("access_token");
    target.removeItem("refresh_token");
  } catch {
    // no-op
  }
}

export function buildPages(current: number, total: number): Array<number | "..."> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: Array<number | "..."> = [1];
  const left = Math.max(2, current - 1);
  const right = Math.min(total - 1, current + 1);

  if (left > 2) pages.push("...");
  for (let i = left; i <= right; i += 1) pages.push(i);
  if (right < total - 1) pages.push("...");
  pages.push(total);

  return pages;
}

export function buildAdminMessagesQuery(params: {
  pageSize: number;
  page: number;
  sortField: string;
  sortDir: "asc" | "desc";
  query: string;
}): string {
  const searchParams = new URLSearchParams();
  searchParams.set("limit", String(params.pageSize));
  searchParams.set("page", String(params.page));
  searchParams.set("sort", params.sortField);
  searchParams.set("dir", params.sortDir);

  const search = params.query.trim();
  if (search) {
    searchParams.set("q", search);
  }

  return searchParams.toString();
}

export function isAuthErrorStatus(status: number): boolean {
  return status === 401 || status === 403;
}

export function buildApiErrorMessage(status: number, text?: string | null): string {
  const message = (text ?? "").trim();
  return message || `Erreur API (${status})`;
}

export function normalizeUnknownError(error: unknown): string {
  return error instanceof Error ? error.message : "Erreur inattendue";
}

export function splitSelected<T extends { id: number }>(
  items: T[],
  selectedIds: Set<number>
): { kept: T[]; removed: T[]; removedIds: number[] } {
  const removed: T[] = [];
  const kept: T[] = [];

  for (const item of items) {
    if (selectedIds.has(item.id)) {
      removed.push(item);
    } else {
      kept.push(item);
    }
  }

  return {
    kept,
    removed,
    removedIds: removed.map((item) => item.id),
  };
}

export function toggleIdInSet(prev: Set<number>, id: number): Set<number> {
  const next = new Set(prev);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  return next;
}

export function nextSortState(
  currentField: string,
  currentDir: "asc" | "desc",
  requestedField: string
): { field: string; dir: "asc" | "desc" } {
  if (requestedField === currentField) {
    return { field: currentField, dir: currentDir === "asc" ? "desc" : "asc" };
  }
  return { field: requestedField, dir: "asc" };
}

export function sortArrowForField(
  field: string,
  currentField: string,
  currentDir: "asc" | "desc"
): "↑" | "↓" | null {
  if (field !== currentField) return null;
  return currentDir === "asc" ? "↑" : "↓";
}
