// frontend/src/app/components/home/ReferenceModal.tsx
"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { ReferenceItem } from "../../content/references";

const EXIT_MS = 520;

export default function ReferenceModal({
  item,
  onClose,
}: {
  item: ReferenceItem | null;
  onClose: () => void;
}) {
  const [mountedItem, setMountedItem] = useState<ReferenceItem | null>(null);
  const [open, setOpen] = useState(false);

  const closingRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!item) return;

    setMountedItem(item);
    closingRef.current = false;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => setOpen(true));

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [item]);

  useEffect(() => {
    if (!mountedItem) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mountedItem]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  function requestClose() {
    if (closingRef.current) return;
    closingRef.current = true;

    setOpen(false);

    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => {
      setMountedItem(null);
      closingRef.current = false;
      onClose();
    }, EXIT_MS);
  }

  if (!mountedItem) return null;

  const ease = "ease-[cubic-bezier(0.22,1,0.36,1)]";
  const dur = open ? "duration-[420ms]" : "duration-[520ms]";

  const badgeSrc = mountedItem.badgeSrc;
  const badgeAlt = mountedItem.badgeAlt ?? "Badge";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Détail de mission — ${mountedItem.nameExpanded}`}
      className="fixed inset-0 z-[120] p-4"
    >
      <button
        type="button"
        aria-label="Fermer"
        onClick={requestClose}
        className={[
          "absolute inset-0 touch-none",
          "transition-[opacity,backdrop-filter,background-color]",
          ease,
          dur,
          open
            ? "opacity-100 bg-black/45 backdrop-blur-[2px]"
            : "opacity-0 bg-black/0 backdrop-blur-0",
        ].join(" ")}
      />

      <div
        className={[
          "relative mx-auto w-[min(980px,95vw)] overflow-hidden rounded-3xl border border-neutral-200 bg-white/85 shadow-2xl backdrop-blur-md",
          "dark:border-neutral-800 dark:bg-neutral-900/80",
          "transition-[transform,opacity] will-change-transform",
          ease,
          dur,
          open
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-4 scale-[0.98]",
        ].join(" ")}
      >
        <div className="pointer-events-none absolute inset-0 z-0">
          <Image
            src={mountedItem.imageSrc}
            alt=""
            fill
            sizes="(min-width: 768px) 980px, 95vw"
            className="object-cover opacity-[0.22] dark:opacity-[0.16] blur-[6px]"
            priority={false}
          />
          <div className="absolute inset-0 bg-white/18 dark:bg-black/18" />
        </div>

        <div className="relative z-10 flex items-start justify-between gap-6 border-b border-neutral-200/70 p-6 dark:border-neutral-800/70">
          <div className="min-w-0">
            {mountedItem.label ? (
              <span className="inline-flex items-center rounded-full border border-neutral-200/70 bg-white/55 px-3 py-1 text-xs font-medium text-neutral-700 backdrop-blur-sm dark:border-neutral-800/70 dark:bg-neutral-950/35 dark:text-neutral-200">
                {mountedItem.label}
              </span>
            ) : null}

            <h3 className="mt-3 truncate text-xl font-semibold text-neutral-900 dark:text-neutral-50">
              {mountedItem.nameExpanded}
            </h3>
            <p className="mt-1 truncate text-sm text-neutral-700 dark:text-neutral-200">
              {mountedItem.missionTitle}
            </p>
          </div>

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
              onClick={requestClose}
              className="rounded-xl border border-neutral-200/70 bg-white/60 px-3 py-2 text-sm font-semibold text-neutral-900 backdrop-blur-sm hover:bg-white/80
                         focus:outline-none focus:ring-2 focus:ring-neutral-400/40
                         dark:border-neutral-800/70 dark:bg-neutral-950/35 dark:text-neutral-50 dark:hover:bg-neutral-950/55"
            >
              Fermer
            </button>
          </div>
        </div>

        <div className="relative z-10 max-h-[72vh] overflow-auto p-6">
          {/* … ton contenu inchangé … */}
          <div className="grid gap-4 md:grid-cols-12">
            <div className="md:col-span-5 rounded-2xl border border-neutral-200/70 bg-white/60 p-5 backdrop-blur-sm dark:border-neutral-800/70 dark:bg-neutral-950/35">
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                Situation
              </p>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-neutral-700 dark:text-neutral-200">
                {mountedItem.situation}
              </p>
            </div>

            <div className="md:col-span-7 grid gap-4">
              <div className="rounded-2xl border border-neutral-200/70 bg-white/60 p-5 backdrop-blur-sm dark:border-neutral-800/70 dark:bg-neutral-950/35">
                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                  Tâches
                </p>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-neutral-700 dark:text-neutral-200">
                  {mountedItem.tasks.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-neutral-200/70 bg-white/60 p-5 backdrop-blur-sm dark:border-neutral-800/70 dark:bg-neutral-950/35">
                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                  Actions
                </p>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-neutral-700 dark:text-neutral-200">
                  {mountedItem.actions.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-neutral-200/70 bg-white/60 p-5 backdrop-blur-sm dark:border-neutral-800/70 dark:bg-neutral-950/35">
                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                  Résultats
                </p>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-neutral-700 dark:text-neutral-200">
                  {mountedItem.results.map((p) => (
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
