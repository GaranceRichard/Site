"use client";

import Image from "next/image";
import { useEffect } from "react";
import type { ReferenceItem } from "../../content/references";

export default function ReferenceModal({
  item,
  onClose,
}: {
  item: ReferenceItem | null;
  onClose: () => void;
}) {
  const open = Boolean(item);

  useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!item) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Détail de mission — ${item.nameExpanded}`}
      className="fixed inset-0 z-[120] p-4"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Fermer"
        onClick={onClose}
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px] touch-none"
      />

      {/* Panel */}
      <div className="relative mx-auto w-[min(980px,95vw)] overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-900">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-neutral-200 p-6 dark:border-neutral-800">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {item.label ? (
                <span className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200">
                  {item.label}
                </span>
              ) : null}

              <span className="text-xs font-medium tracking-wide text-neutral-500 dark:text-neutral-400">
                Référence
              </span>
            </div>

            <h3 className="mt-3 text-xl font-semibold text-neutral-900 dark:text-neutral-50">
              {item.nameExpanded}
            </h3>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
              {item.missionTitle}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-900 hover:bg-neutral-50
                       focus:outline-none focus:ring-2 focus:ring-neutral-400/40
                       dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50 dark:hover:bg-neutral-900"
          >
            Fermer
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[72vh] overflow-auto p-6">
          <div className="grid gap-4 md:grid-cols-12">
            {/* Col gauche : visuel + situation */}
            <div className="md:col-span-5 grid gap-4">
              <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950">
                <div className="relative h-[220px] w-full">
                  <Image
                    src={item.imageSrc}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 40vw, 90vw"
                    className="object-contain p-8"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 dark:border-neutral-800 dark:bg-neutral-950">
                <p className="text-sm font-semibold">Situation</p>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300 whitespace-pre-line">
                  {item.situation}
                </p>
              </div>
            </div>

            {/* Col droite : tâches / actions / résultats */}
            <div className="md:col-span-7 grid gap-4">
              <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
                <p className="text-sm font-semibold">Tâches</p>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-neutral-600 dark:text-neutral-300">
                  {item.tasks.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
                <p className="text-sm font-semibold">Actions</p>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-neutral-600 dark:text-neutral-300">
                  {item.actions.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
                <p className="text-sm font-semibold">Résultats</p>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-neutral-600 dark:text-neutral-300">
                  {item.results.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <p className="mt-6 text-xs text-neutral-500 dark:text-neutral-400">
            *Éviter toute information confidentielle : rester sur des effets observables et des pratiques.
          </p>
        </div>
      </div>
    </div>
  );
}
