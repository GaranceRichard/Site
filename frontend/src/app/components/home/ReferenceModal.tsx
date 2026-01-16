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

  // Badge optionnel (ex: French Tech)
    const badgeSrc = item.badgeSrc;
    const badgeAlt = item.badgeAlt ?? "Badge";


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
      <div className="relative mx-auto w-[min(980px,95vw)] overflow-hidden rounded-3xl border border-neutral-200 bg-white/85 shadow-2xl backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/80">
        {/* Filigrane plein fond (cover) */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <Image
            src={item.imageSrc}
            alt=""
            fill
            sizes="(min-width: 768px) 980px, 95vw"
            className="object-cover opacity-[0.22] dark:opacity-[0.16] blur-[6px]"
            priority={false}
          />
          {/* voile léger pour lisibilité */}
          <div className="absolute inset-0 bg-white/18 dark:bg-black/18" />
        </div>

        {/* Header */}
        <div className="relative z-10 flex items-start justify-between gap-6 border-b border-neutral-200/70 p-6 dark:border-neutral-800/70">
          {/* Left: titre */}
          <div className="min-w-0">
            {item.label ? (
              <span className="inline-flex items-center rounded-full border border-neutral-200/70 bg-white/55 px-3 py-1 text-xs font-medium text-neutral-700 backdrop-blur-sm dark:border-neutral-800/70 dark:bg-neutral-950/35 dark:text-neutral-200">
                {item.label}
              </span>
            ) : null}

            <h3 className="mt-3 truncate text-xl font-semibold text-neutral-900 dark:text-neutral-50">
              {item.nameExpanded}
            </h3>
            <p className="mt-1 truncate text-sm text-neutral-700 dark:text-neutral-200">
              {item.missionTitle}
            </p>
          </div>

          {/* Right: badge (plus haut) + bouton fermer */}
          <div className="flex shrink-0 items-start gap-3">
            {badgeSrc ? (
              <div className="shrink-0">
                <div className="relative h-20 w-28 overflow-hidden rounded-2xl border border-neutral-200/70 bg-white/55 backdrop-blur-sm dark:border-neutral-800/70 dark:bg-neutral-950/35">
                  <Image
                    src={badgeSrc}
                    alt={badgeAlt}
                    fill
                    sizes="112px"
                    className="object-contain p-2"
                    priority={false}
                  />
                </div>
              </div>
            ) : null}

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-neutral-200/70 bg-white/60 px-3 py-2 text-sm font-semibold text-neutral-900 backdrop-blur-sm hover:bg-white/80
                         focus:outline-none focus:ring-2 focus:ring-neutral-400/40
                         dark:border-neutral-800/70 dark:bg-neutral-950/35 dark:text-neutral-50 dark:hover:bg-neutral-950/55"
            >
              Fermer
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="relative z-10 max-h-[72vh] overflow-auto p-6">
          <div className="grid gap-4 md:grid-cols-12">
            <div className="md:col-span-5 rounded-2xl border border-neutral-200/70 bg-white/60 p-5 backdrop-blur-sm dark:border-neutral-800/70 dark:bg-neutral-950/35">
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                Situation
              </p>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-neutral-700 dark:text-neutral-200">
                {item.situation}
              </p>
            </div>

            <div className="md:col-span-7 grid gap-4">
              <div className="rounded-2xl border border-neutral-200/70 bg-white/60 p-5 backdrop-blur-sm dark:border-neutral-800/70 dark:bg-neutral-950/35">
                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                  Tâches
                </p>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-neutral-700 dark:text-neutral-200">
                  {item.tasks.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-neutral-200/70 bg-white/60 p-5 backdrop-blur-sm dark:border-neutral-800/70 dark:bg-neutral-950/35">
                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                  Actions
                </p>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-neutral-700 dark:text-neutral-200">
                  {item.actions.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-neutral-200/70 bg-white/60 p-5 backdrop-blur-sm dark:border-neutral-800/70 dark:bg-neutral-950/35">
                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                  Résultats
                </p>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-neutral-700 dark:text-neutral-200">
                  {item.results.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
