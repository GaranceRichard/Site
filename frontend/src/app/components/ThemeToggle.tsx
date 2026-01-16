// frontend/src/app/components/ThemeToggle.tsx
"use client";

import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";
const KEY = "theme";

function getThemeFromDom(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

function subscribe(callback: () => void) {
  // Observe les changements de classe sur <html> (ex: script theme-init, autres toggles)
  const el = document.documentElement;

  const obs = new MutationObserver(() => callback());
  obs.observe(el, { attributes: true, attributeFilter: ["class"] });

  // Optionnel: si un autre code déclenche un event "themechange"
  const onThemeChange = () => callback();
  window.addEventListener("themechange", onThemeChange);

  return () => {
    obs.disconnect();
    window.removeEventListener("themechange", onThemeChange);
  };
}

export default function ThemeToggle({ className }: { className?: string }) {
  // ✅ SSR: on force un snapshot stable ("light") pour éviter mismatch
  const theme = useSyncExternalStore(
    subscribe,
    () => getThemeFromDom(),
    () => "light"
  );

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    try {
      window.localStorage.setItem(KEY, next);
    } catch {}

    applyTheme(next);

    // Notifie les autres listeners éventuels (et utile si MutationObserver est absent)
    try {
      window.dispatchEvent(new Event("themechange"));
    } catch {}
  }

  const base =
    className ??
    "inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-900 shadow-[0_1px_0_rgba(0,0,0,0.04)] hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-50 dark:hover:bg-neutral-800";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Passer en mode jour" : "Passer en mode nuit"}
      title={theme === "dark" ? "Mode jour" : "Mode nuit"}
      className={base}
    >
      {theme === "dark" ? (
        // Soleil
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        // Lune
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.5 6.5 0 0 0 9.8 9.8z" />
        </svg>
      )}
    </button>
  );
}
