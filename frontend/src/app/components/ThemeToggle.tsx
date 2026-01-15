// frontend/src/app/components/ThemeToggle.tsx
"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";
const KEY = "theme";

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

function getInitialTheme(): Theme {
  const stored = window.localStorage.getItem(KEY);
  if (stored === "light" || stored === "dark") return stored;
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export default function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const t = getInitialTheme();
    setTheme(t);
    applyTheme(t);
  }, []);

  function toggle() {
    setTheme((current) => {
      const next: Theme = current === "dark" ? "light" : "dark";
      window.localStorage.setItem(KEY, next);
      applyTheme(next);
      return next;
    });
  }

    return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Passer en mode jour" : "Passer en mode nuit"}
      title={theme === "dark" ? "Mode jour" : "Mode nuit"}
      className={className}
    >
      {theme === "dark" ? (
        // Soleil
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        // Lune
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      )}
    </button>
  );

}
