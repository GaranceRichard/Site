"use client";

import type { MouseEvent } from "react";
import Image from "next/image";
import ThemeToggle from "../../components/ThemeToggle";
import type { BackofficeSection } from "../types";

type SidebarProps = {
  section: BackofficeSection;
  onSelectSection: (section: BackofficeSection) => void;
  onGoHome: () => void;
  onRefresh: () => void;
  onLogout: () => void;
};

const SECTIONS: Array<{ id: BackofficeSection; label: string }> = [
  { id: "messages", label: "Messages contact" },
  { id: "header", label: "Header" },
  { id: "home", label: "Accueil" },
  { id: "promise", label: "Positionnement" },
  { id: "method", label: "Approche" },
  { id: "publications", label: "Publications" },
  { id: "references", label: "References" },
  { id: "about", label: "A propos" },
  { id: "stats", label: "Statistiques" },
];

function getSectionButtonClass(isActive: boolean): string {
  return [
    "w-full rounded-xl px-3 py-2 text-left text-sm font-semibold",
    isActive
      ? "bg-neutral-900 text-white"
      : "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50",
    "dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200 dark:hover:bg-neutral-900",
  ].join(" ");
}

export default function Sidebar({
  section,
  onSelectSection,
  onGoHome,
  onRefresh,
  onLogout,
}: SidebarProps) {
  function handleSectionClick(event: MouseEvent<HTMLButtonElement>) {
    const nextSection = event.currentTarget.dataset.section as
      | BackofficeSection
      | undefined;
    if (nextSection) {
      onSelectSection(nextSection);
    }
  }

  return (
    <aside className="w-64 shrink-0 border-r border-neutral-200 bg-white px-5 py-6 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={onGoHome}
            aria-label="Retour au site (logo)"
            className="rounded-lg p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <Image
              src="/brand/logo.png"
              alt=""
              width={34}
              height={34}
              className="h-8 w-8 object-contain"
              priority={false}
            />
          </button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">Admin</p>
            <h1 className="mt-3 text-xl font-semibold">Backoffice</h1>
          </div>
        </div>
        <ThemeToggle className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-900 shadow-[0_1px_0_rgba(0,0,0,0.04)] hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50 dark:hover:bg-neutral-900" />
      </div>

      <div className="mt-8 space-y-2">
        {SECTIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            data-section={item.id}
            onClick={handleSectionClick}
            className={getSectionButtonClass(section === item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-auto space-y-2 pt-6">
        <button
          type="button"
          onClick={onGoHome}
          className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-left text-sm font-semibold hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900"
        >
          Retour au site
        </button>
        <button
          type="button"
          onClick={onRefresh}
          aria-label="Rafraîchir"
          className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-left text-sm font-semibold hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900"
        >
          Rafraichir
        </button>
        <button
          type="button"
          onClick={onLogout}
          aria-label="Se déconnecter"
          className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-left text-sm font-semibold hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900"
        >
          Se deconnecter
        </button>
      </div>
    </aside>
  );
}
