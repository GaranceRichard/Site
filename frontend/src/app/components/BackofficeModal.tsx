"use client";

import { useEffect } from "react";

export default function BackofficeModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center">
      {/* Backdrop */}
      <button
        aria-label="Fermer"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />

      {/* Panel */}
      <div className="relative z-10 w-[min(420px,92vw)] rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="text-lg font-semibold">Accès back-office</h2>

        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
          Accès réservé. Authentification requise.
        </p>

        {/* Placeholder login */}
        <div className="mt-6 space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950"
          />
          <input
            type="password"
            placeholder="Mot de passe"
            className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950"
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-xl border border-neutral-200 px-4 py-2 text-sm dark:border-neutral-800"
          >
            Annuler
          </button>
          <button
            disabled
            className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white opacity-60"
          >
            Se connecter
          </button>
        </div>
      </div>
    </div>
  );
}
