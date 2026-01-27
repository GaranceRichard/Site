"use client";

import ThemeToggle from "../../components/ThemeToggle";
import type { BackofficeSection } from "../types";

type SidebarProps = {
  section: BackofficeSection;
  onSelectSection: (section: BackofficeSection) => void;
  onGoHome: () => void;
  onRefresh: () => void;
  onLogout: () => void;
};

export default function Sidebar({
  section,
  onSelectSection,
  onGoHome,
  onRefresh,
  onLogout,
}: SidebarProps) {
  return (
    <aside className="w-64 shrink-0 border-r border-neutral-200 bg-white px-5 py-6 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
            Admin
          </p>
          <h1 className="mt-3 text-xl font-semibold">Backoffice</h1>
        </div>
        <ThemeToggle className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-900 shadow-[0_1px_0_rgba(0,0,0,0.04)] hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50 dark:hover:bg-neutral-900" />
      </div>

      <div className="mt-8 space-y-2">
        <button
          type="button"
          onClick={() => onSelectSection("messages")}
          className={[
            "w-full rounded-xl px-3 py-2 text-left text-sm font-semibold",
            section === "messages"
              ? "bg-neutral-900 text-white"
              : "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50",
            "dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200 dark:hover:bg-neutral-900",
          ].join(" ")}
        >
          Messages contact
        </button>
        <button
          type="button"
          className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-left text-sm font-semibold text-neutral-400"
          disabled
        >
          Statistiques (bientôt)
        </button>
        <button
          type="button"
          className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-left text-sm font-semibold text-neutral-400"
          disabled
        >
          Réglages (bientôt)
        </button>
      </div>

      <div className="mt-auto space-y-2 pt-6">
        <button
          type="button"
          onClick={onGoHome}
          className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-left text-sm font-semibold hover:bg-neutral-50
                     dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900"
        >
          Retour au site
        </button>
        <button
          type="button"
          onClick={onRefresh}
          className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-left text-sm font-semibold hover:bg-neutral-50
                     dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900"
        >
          Rafraîchir
        </button>
        <button
          type="button"
          onClick={onLogout}
          className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-left text-sm font-semibold hover:bg-neutral-50
                     dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900"
        >
          Se déconnecter
        </button>
      </div>
    </aside>
  );
}
