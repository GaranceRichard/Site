// frontend/src/app/components/BackofficeModal.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";

const EXIT_MS = 520;

export default function BackofficeModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  // ✅ Animation de sortie : on garde la modale montée le temps du "leave"
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const rafRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const closingRef = useRef(false);

  // ✅ Synchronisation avec la prop `open`
  useEffect(() => {
    if (open) {
      setMounted(true);
      closingRef.current = false;

      // reset optionnel à l'ouverture
      setEmail("");
      setPassword("");

      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      rafRef.current = requestAnimationFrame(() => setVisible(true));
      return;
    }

    // fermeture demandée : anime la sortie
    if (!mounted) return;

    if (closingRef.current) return;
    closingRef.current = true;

    setVisible(false);

    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => {
      setMounted(false);
      closingRef.current = false;
    }, EXIT_MS);
  }, [open, mounted]);

  // ✅ ESC + scroll lock tant que monté
  useEffect(() => {
    if (!mounted) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };

    window.addEventListener("keydown", onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  // ✅ Nettoyage
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  function requestClose() {
    // Le parent passera open=false, et l'animation de sortie se joue ici
    onClose();
  }

  function onEmailChange(e: ChangeEvent<HTMLInputElement>) {
    setEmail(e.currentTarget.value);
  }

  function onPasswordChange(e: ChangeEvent<HTMLInputElement>) {
    setPassword(e.currentTarget.value);
  }

  if (!mounted) return null;

  const ease = "ease-[cubic-bezier(0.22,1,0.36,1)]";
  const dur = visible ? "duration-[420ms]" : "duration-[520ms]";

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Fermer"
        onClick={requestClose}
        className={[
          "absolute inset-0",
          "transition-[opacity,backdrop-filter,background-color]",
          ease,
          dur,
          visible
            ? "opacity-100 bg-black/50 backdrop-blur-sm"
            : "opacity-0 bg-black/0 backdrop-blur-0",
        ].join(" ")}
      />

      {/* Panel */}
      <div
        className={[
          "relative z-10 w-[min(420px,92vw)] rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl",
          "dark:border-neutral-800 dark:bg-neutral-900",
          "transition-[transform,opacity] will-change-transform",
          ease,
          dur,
          visible
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-4 scale-[0.98]",
        ].join(" ")}
      >
        <h2 className="text-lg font-semibold">Accès back-office</h2>

        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
          Accès réservé. Authentification requise.
        </p>

        <div className="mt-6 space-y-4">
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={onEmailChange}
            autoComplete="email"
            className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950"
          />

          <input
            name="password"
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={onPasswordChange}
            autoComplete="current-password"
            className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950"
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={requestClose}
            className="rounded-xl border border-neutral-200 px-4 py-2 text-sm dark:border-neutral-800"
          >
            Annuler
          </button>

          <button
            type="button"
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
