"use client";

import { buildPages } from "../logic";
import type { Msg, SortField } from "../types";

type MessagesTableProps = {
  items: Msg[];
  selectedIds: Set<number>;
  page: number;
  totalPages: number;
  totalCount: number;
  onToggleSelected: (id: number) => void;
  onSelectMessage: (msg: Msg) => void;
  onDeleteSelected: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onSetPage: (page: number) => void;
  onChangeSort: (field: SortField) => void;
  getSortArrow: (field: SortField) => "↑" | "↓" | null;
};

function SortBadge({ arrow }: { arrow: "↑" | "↓" | null }) {
  if (!arrow) return null;
  return (
    <span className="text-xs font-semibold text-neutral-400" aria-hidden="true">
      {arrow}
    </span>
  );
}

export default function MessagesTable({
  items,
  selectedIds,
  page,
  totalPages,
  totalCount,
  onToggleSelected,
  onSelectMessage,
  onDeleteSelected,
  onPrevPage,
  onNextPage,
  onSetPage,
  onChangeSort,
  getSortArrow,
}: MessagesTableProps) {
  if (items.length === 0) return null;

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="grid grid-cols-[36px_1.2fr_1.4fr_1.4fr_0.7fr] items-center gap-3 border-b border-neutral-200 pb-2 text-center text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:border-neutral-800">
        <span className="flex items-center justify-center" />
        <button
          type="button"
          onClick={() => onChangeSort("name")}
          aria-label="Trier par nom"
          className="inline-flex w-full items-center justify-center gap-2"
        >
          <span>Nom</span>
          <SortBadge arrow={getSortArrow("name")} />
        </button>
        <button
          type="button"
          onClick={() => onChangeSort("email")}
          aria-label="Trier par email"
          className="inline-flex w-full items-center justify-center gap-2"
        >
          <span>Email</span>
          <SortBadge arrow={getSortArrow("email")} />
        </button>
        <button
          type="button"
          onClick={() => onChangeSort("subject")}
          aria-label="Trier par sujet"
          className="inline-flex w-full items-center justify-center gap-2"
        >
          <span>Sujet</span>
          <SortBadge arrow={getSortArrow("subject")} />
        </button>
        <button
          type="button"
          onClick={() => onChangeSort("created_at")}
          aria-label="Trier par date"
          className="inline-flex w-full items-center justify-center gap-2"
        >
          <span>Date</span>
          <SortBadge arrow={getSortArrow("created_at")} />
        </button>
      </div>

      <ul className="min-h-[440px] divide-y divide-neutral-200 text-sm dark:divide-neutral-800">
        {items.map((m) => (
          <li key={m.id} className="py-3">
            <div className="grid w-full grid-cols-[36px_1.2fr_1.4fr_1.4fr_0.7fr] items-center gap-3 text-center">
              <input
                type="checkbox"
                aria-label={`Selectionner ${m.name}`}
                checked={selectedIds.has(m.id)}
                onChange={() => onToggleSelected(m.id)}
                className="h-4 w-4 justify-self-center accent-neutral-900 dark:accent-neutral-100"
              />
              <button type="button" onClick={() => onSelectMessage(m)} className="contents">
                <span className="truncate font-semibold">{m.name}</span>
                <span className="truncate text-neutral-600 dark:text-neutral-300">{m.email}</span>
                <span className="truncate text-neutral-600 dark:text-neutral-300">
                  {m.subject || "—"}
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  {new Date(m.created_at).toLocaleDateString()}
                </span>
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-500 dark:text-neutral-400">
        <span>
          Page {page} / {totalPages} — {totalCount} message(s)
          {selectedIds.size ? ` — ${selectedIds.size} sélectionné(s)` : ""}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDeleteSelected}
            disabled={selectedIds.size === 0}
            className="rounded-lg border border-neutral-200 px-3 py-1 text-xs font-semibold text-red-700 disabled:opacity-50
                       dark:border-neutral-800 dark:text-red-300"
          >
            Supprimer
          </button>
          <button
            type="button"
            onClick={onPrevPage}
            disabled={page <= 1}
            className="rounded-lg border border-neutral-200 px-3 py-1 text-xs font-semibold disabled:opacity-50
                       dark:border-neutral-800"
          >
            Prev
          </button>
          {buildPages(page, totalPages).map((p, idx) =>
            p === "..." ? (
              <span key={`ellipsis-${idx}`} className="px-1">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                aria-label={`Page ${p}`}
                onClick={() => onSetPage(p)}
                className={[
                  "rounded-lg border border-neutral-200 px-2 py-1 text-xs font-semibold",
                  p === page ? "bg-neutral-900 text-white" : "bg-white text-neutral-700 hover:bg-neutral-50",
                  "dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200 dark:hover:bg-neutral-900",
                ].join(" ")}
              >
                {p}
              </button>
            )
          )}
          <button
            type="button"
            onClick={onNextPage}
            disabled={page >= totalPages}
            className="rounded-lg border border-neutral-200 px-3 py-1 text-xs font-semibold disabled:opacity-50
                       dark:border-neutral-800"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
