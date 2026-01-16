// frontend/src/app/components/ThemeToggle.tsx
"use client";

import { useState } from "react";

type Theme = "light" | "dark";
const KEY = "theme";

function safeApplyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
}

function safeGetThemeFromDom(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export default function ThemeToggle({ className }: { className?: string }) {
  // ✅ Important : initializer "safe" pour SSR/prerender (pas de document direct)
  const [theme, setTheme] = useState<Theme>(() => safeGetThemeFromDom());

  function toggle() {
    setTheme((current) => {
      const next: Theme = current === "dark" ? "light" : "dark";
      try {
        window.localStorage.setItem(KEY, next);
      } catch {}
      safeApplyTheme(next);
      return next;
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Passer en mode jour" : "Passer en mode nuit"}
      title={theme === "dark" ? "Mode jour" : "Mode nuit"}
      className={
        className ??
        "inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-900 shadow-[0_1px_0_rgba(0,0,0,0.04)] hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-50 dark:hover:bg-neutral-800"
      }
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
