"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type FlashKind = "contact_success";
const KEY = "flash";

export default function FlashToast() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<FlashKind | null>(null);

  useEffect(() => {
    let timer: number | null = null;
    let cancelled = false;

    function showToast(v: FlashKind) {
      if (cancelled) return;

      setKind(v);
      setOpen(true);

      timer = window.setTimeout(() => {
        if (!cancelled) setOpen(false);
      }, 3500);
    }

    try {
      const v = window.sessionStorage.getItem(KEY) as FlashKind | null;
      if (!v) return;

      window.sessionStorage.removeItem(KEY);

      // ✅ évite setState "synchrones" dans l'effet (lint)
      if (typeof queueMicrotask === "function") {
        queueMicrotask(() => showToast(v));
      } else {
        window.setTimeout(() => showToast(v), 0);
      }
    } catch {
      // no-op
    }

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [pathname]);

  if (!open || !kind) return null;

  const title = kind === "contact_success" ?"Message envoyé" : "Information";
  const message =
    kind === "contact_success"
      ?"Merci, votre message a bien été envoyé."
      : "Action effectuée.";

  return (
    <div className="fixed inset-x-0 top-3 z-[200] flex justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white/95 p-4 shadow-xl backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/95">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
              {title}
            </p>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
              {message}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 hover:bg-neutral-50
                       dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-50 dark:hover:bg-neutral-900"
            aria-label="Fermer la notification"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
