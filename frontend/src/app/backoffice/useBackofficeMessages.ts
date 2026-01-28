"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildAdminMessagesQuery,
  buildApiErrorMessage,
  clearAuthTokens,
  isAuthErrorStatus,
  nextSortState,
  normalizeUnknownError,
  sortArrowForField,
  splitSelected,
  toggleIdInSet,
} from "./logic";
import type { Msg, SortDir, SortField } from "./types";

type UseBackofficeMessagesParams = {
  apiBase: string | undefined;
  backofficeEnabled: boolean;
  routerPush: (path: string) => void;
};

export function useBackofficeMessages({
  apiBase,
  backofficeEnabled,
  routerPush,
}: UseBackofficeMessagesParams) {
  const [openLogin, setOpenLogin] = useState(false);
  const [items, setItems] = useState<Msg[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [authMsg, setAuthMsg] = useState<string>("");
  const [selected, setSelected] = useState<Msg | null>(null);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [undoIds, setUndoIds] = useState<number[] | null>(null);
  const [undoItems, setUndoItems] = useState<Msg[]>([]);
  const undoTimerRef = useRef<number | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const pageRef = useRef(page);

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const visibleItems = items;

  const clearUndoTimer = useCallback(() => {
    if (undoTimerRef.current) {
      window.clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
  }, []);

  const load = useCallback(
    async (nextPage: number) => {
      setErrorMsg("");
      setAuthMsg("");
      setSelectedIds(new Set());

      if (!apiBase) {
        setStatus("error");
        setErrorMsg("Configuration manquante : NEXT_PUBLIC_API_BASE_URL.");
        return;
      }

      let token: string | null = null;
      try {
        token = sessionStorage.getItem("access_token");
      } catch {
        token = null;
      }

      if (!token) {
        setStatus("idle");
        setItems([]);
        setTotalCount(0);
        routerPush("/");
        return;
      }

      setStatus("loading");

      try {
        const queryString = buildAdminMessagesQuery({
          pageSize,
          page: nextPage,
          sortField,
          sortDir,
          query,
        });

        const res = await fetch(`${apiBase}/api/contact/messages/admin?${queryString}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (isAuthErrorStatus(res.status)) {
          setStatus("idle");
          setItems([]);
          clearAuthTokens();
          setAuthMsg("Session expiree ou acces refuse. Reconnectez-vous.");
          setOpenLogin(true);
          return;
        }

        if (!res.ok) {
          const txt = await res.text();
          throw new Error(buildApiErrorMessage(res.status, txt));
        }

        const data = (await res.json()) as {
          count: number;
          page: number;
          limit: number;
          results: Msg[];
        };
        setItems(data.results);
        setTotalCount(data.count);
        setPage(data.page);
        setStatus("idle");
        setAuthMsg("");
      } catch (e: unknown) {
        setStatus("error");
        setErrorMsg(normalizeUnknownError(e));
      }
    },
    [apiBase, pageSize, query, routerPush, sortDir, sortField]
  );

  useEffect(() => {
    if (!backofficeEnabled) {
      routerPush("/");
      return;
    }
    void load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backofficeEnabled, page, query, sortField, sortDir]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  useEffect(() => {
    return () => {
      clearUndoTimer();
    };
  }, [clearUndoTimer]);

  const toggleSelected = useCallback((id: number) => {
    setSelectedIds((prev) => toggleIdInSet(prev, id));
  }, []);

  const changeSort = useCallback(
    (field: SortField) => {
      setPage(1);
      const next = nextSortState(sortField, sortDir, field);
      setSortField(next.field as SortField);
      setSortDir(next.dir);
    },
    [sortDir, sortField]
  );

  const getSortArrow = useCallback(
    (field: SortField) => sortArrowForField(field, sortField, sortDir),
    [sortDir, sortField]
  );

  const loadWithExcluded = useCallback(
    async (excludedIds: number[]) => {
      setErrorMsg("");
      setAuthMsg("");
      setSelectedIds(new Set());

      if (!apiBase) {
        setStatus("error");
        setErrorMsg("Configuration manquante : NEXT_PUBLIC_API_BASE_URL.");
        return;
      }

      let token: string | null = null;
      try {
        token = sessionStorage.getItem("access_token");
      } catch {
        token = null;
      }

      if (!token) {
        setStatus("idle");
        setItems([]);
        setTotalCount(0);
        routerPush("/");
        return;
      }

      setStatus("loading");

      const excluded = new Set(excludedIds);
      const merged: Msg[] = [];
      let pageNum = pageRef.current;
      let total = 0;

      try {
        while (merged.length < pageSize) {
          const queryString = buildAdminMessagesQuery({
            pageSize,
            page: pageNum,
            sortField,
            sortDir,
            query,
          });

          const res = await fetch(`${apiBase}/api/contact/messages/admin?${queryString}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (isAuthErrorStatus(res.status)) {
            setStatus("idle");
            setItems([]);
            clearAuthTokens();
            setAuthMsg("Session expiree ou acces refuse. Reconnectez-vous.");
            setOpenLogin(true);
            return;
          }

          if (!res.ok) {
            const txt = await res.text();
            throw new Error(buildApiErrorMessage(res.status, txt));
          }

          const data = (await res.json()) as {
            count: number;
            page: number;
            limit: number;
            results: Msg[];
          };

          total = data.count;
          merged.push(...data.results.filter((item) => !excluded.has(item.id)));

          const totalPagesForQuery = Math.max(1, Math.ceil(total / pageSize));
          if (pageNum >= totalPagesForQuery) {
            break;
          }

          pageNum += 1;
        }

        setItems(merged.slice(0, pageSize));
        setTotalCount(Math.max(0, total - excluded.size));
        setPage(pageRef.current);
        setStatus("idle");
        setAuthMsg("");
      } catch (e: unknown) {
        setStatus("error");
        setErrorMsg(normalizeUnknownError(e));
      }
    },
    [apiBase, pageSize, query, routerPush, sortDir, sortField]
  );

  const deleteSelected = useCallback(async () => {
    if (!apiBase) {
      setStatus("error");
      setErrorMsg("Configuration manquante : NEXT_PUBLIC_API_BASE_URL.");
      return;
    }

    if (selectedIds.size === 0) return;

    let token: string | null = null;
    try {
      token = sessionStorage.getItem("access_token");
    } catch {
      token = null;
    }

    if (!token) {
      setAuthMsg("Connexion requise pour acceder au backoffice.");
      setOpenLogin(true);
      return;
    }

    const { kept, removed, removedIds } = splitSelected(items, selectedIds);
    if (removedIds.length === 0) return;

    const restoreRemoved = () => {
      if (removed.length === 0) return;
      setItems((prev) => [...removed, ...prev]);
      setTotalCount((prev) => prev + removed.length);
    };

    setItems(kept);
    setTotalCount((prev) => Math.max(0, prev - removedIds.length));
    setSelectedIds(new Set());
    setUndoIds(removedIds);
    setUndoItems(removed);
    void loadWithExcluded(removedIds);

    clearUndoTimer();
    undoTimerRef.current = window.setTimeout(async () => {
      setStatus("loading");
      try {
        const res = await fetch(`${apiBase}/api/contact/messages/admin/delete`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ids: removedIds }),
        });

        if (isAuthErrorStatus(res.status)) {
          setStatus("idle");
          clearAuthTokens();
          setAuthMsg("Session expiree ou acces refuse. Reconnectez-vous.");
          setOpenLogin(true);
          restoreRemoved();
          setUndoIds(null);
          setUndoItems([]);
          return;
        }

        if (!res.ok) {
          const txt = await res.text();
          throw new Error(buildApiErrorMessage(res.status, txt));
        }

        setStatus("idle");
        setUndoIds(null);
        setUndoItems([]);
        await load(pageRef.current);
      } catch (e: unknown) {
        setStatus("error");
        setErrorMsg(normalizeUnknownError(e));
        restoreRemoved();
        setUndoIds(null);
        setUndoItems([]);
      }
    }, 5000);
  }, [apiBase, clearUndoTimer, items, load, loadWithExcluded, selectedIds]);

  const undoDelete = useCallback(() => {
    if (!undoIds) return;
    clearUndoTimer();
    setUndoIds(null);
    setUndoItems([]);
    void load(pageRef.current);
  }, [clearUndoTimer, load, undoIds]);

  const closeLoginModal = useCallback(() => {
    setOpenLogin(false);
    void load(page);
  }, [load, page]);

  const onSearchChange = useCallback((value: string) => {
    setQuery(value);
    setPage(1);
  }, []);

  return {
    pageSize,
    totalPages,
    visibleItems,
    openLogin,
    setOpenLogin,
    status,
    errorMsg,
    authMsg,
    selected,
    setSelected,
    page,
    setPage,
    query,
    selectedIds,
    undoIds,
    totalCount,
    sortField,
    sortDir,
    load,
    toggleSelected,
    changeSort,
    getSortArrow,
    deleteSelected,
    undoDelete,
    closeLoginModal,
    onSearchChange,
  };
}
