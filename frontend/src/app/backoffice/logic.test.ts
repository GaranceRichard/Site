import { describe, expect, it } from "vitest";

import {
  buildAdminMessagesQuery,
  buildApiErrorMessage,
  buildPages,
  clearAuthTokens,
  isAuthErrorStatus,
  normalizeUnknownError,
  splitSelected,
  nextSortState,
  sortArrowForField,
  toggleIdInSet,
} from "./logic";

describe("backoffice logic", () => {
  it("buildPages returns a simple range when total <= 7", () => {
    expect(buildPages(1, 3)).toEqual([1, 2, 3]);
  });

  it("buildPages inserts ellipses around the current window when total is large", () => {
    expect(buildPages(5, 10)).toEqual([1, "...", 4, 5, 6, "...", 10]);
  });

  it("clearAuthTokens removes both tokens from storage", () => {
    const removed: string[] = [];
    const storage = {
      removeItem: (key: string) => {
        removed.push(key);
      },
    };

    clearAuthTokens(storage);

    expect(removed).toEqual(["access_token", "refresh_token"]);
  });

  it("buildAdminMessagesQuery includes q only when search is non-empty", () => {
    const noSearch = buildAdminMessagesQuery({
      pageSize: 10,
      page: 2,
      sortField: "created_at",
      sortDir: "desc",
      query: "   ",
    });
    expect(noSearch).toContain("limit=10");
    expect(noSearch).toContain("page=2");
    expect(noSearch).toContain("sort=created_at");
    expect(noSearch).toContain("dir=desc");
    expect(noSearch).not.toContain("q=");

    const withSearch = buildAdminMessagesQuery({
      pageSize: 10,
      page: 2,
      sortField: "created_at",
      sortDir: "desc",
      query: "alice",
    });
    expect(withSearch).toContain("q=alice");
  });

  it("isAuthErrorStatus detects 401/403", () => {
    expect(isAuthErrorStatus(401)).toBe(true);
    expect(isAuthErrorStatus(403)).toBe(true);
    expect(isAuthErrorStatus(500)).toBe(false);
  });

  it("buildApiErrorMessage prefers server text and falls back to status", () => {
    expect(buildApiErrorMessage(500, "  boom  ")).toBe("boom");
    expect(buildApiErrorMessage(500, "")).toBe("Erreur API (500)");
  });

  it("normalizeUnknownError handles Error and unknown", () => {
    expect(normalizeUnknownError(new Error("nope"))).toBe("nope");
    expect(normalizeUnknownError("x")).toBe("Erreur inattendue");
  });

  it("splitSelected returns kept/removed/ids consistently", () => {
    const items = [
      { id: 1, name: "A" },
      { id: 2, name: "B" },
      { id: 3, name: "C" },
    ];
    const selected = new Set<number>([2, 3]);

    const result = splitSelected(items, selected);

    expect(result.kept.map((i) => i.id)).toEqual([1]);
    expect(result.removed.map((i) => i.id)).toEqual([2, 3]);
    expect(result.removedIds).toEqual([2, 3]);
  });

  it("toggleIdInSet toggles membership immutably", () => {
    const start = new Set<number>([1]);
    const added = toggleIdInSet(start, 2);
    const removed = toggleIdInSet(added, 1);

    expect(start.has(2)).toBe(false);
    expect(added.has(1)).toBe(true);
    expect(added.has(2)).toBe(true);
    expect(removed.has(1)).toBe(false);
    expect(removed.has(2)).toBe(true);
  });

  it("nextSortState toggles dir on same field and resets on new field", () => {
    expect(nextSortState("email", "asc", "email")).toEqual({
      field: "email",
      dir: "desc",
    });
    expect(nextSortState("email", "desc", "name")).toEqual({
      field: "name",
      dir: "asc",
    });
  });

  it("sortArrowForField returns arrow only for the active field", () => {
    expect(sortArrowForField("email", "email", "asc")).toBe("↑");
    expect(sortArrowForField("email", "email", "desc")).toBe("↓");
    expect(sortArrowForField("name", "email", "asc")).toBeNull();
  });
});
