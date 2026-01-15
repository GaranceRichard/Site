// frontend/src/app/components/TopNav.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ScrollNav from "./ScrollNav";
import ThemeToggle from "./ThemeToggle";
import ScrollTo from "./ScrollTo";


type NavItem = { label: string; href: string };

export default function TopNav({
  nav,
  bookingUrl,
}: {
  nav: NavItem[];
  bookingUrl: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const NAV_PILL =
    "inline-flex items-center justify-center whitespace-nowrap rounded-xl border border-neutral-200 bg-white px-2.5 py-1 text-sm font-semibold text-neutral-900 shadow-[0_1px_0_rgba(0,0,0,0.04)] hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-50 dark:hover:bg-neutral-800";

  function closeMenu() {
    setOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-neutral-50/85 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/75">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <div className="flex h-[72px] items-center justify-between gap-6">
          {/* Branding */}
          <ScrollTo targetId="home" className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 bg-white text-sm font-semibold shadow-[0_1px_0_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900">
              G
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold">Garance</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Coach Lean-Agile
              </p>
            </div>
          </ScrollTo>


          {/* Desktop nav */}
          <nav className="hidden items-center gap-3 md:flex">
            <ScrollNav items={nav} className={NAV_PILL} />
          </nav>

          <div className="flex items-center gap-2 md:gap-3">
            {/* Desktop CTA d'abord */}
            <div className="hidden md:flex items-center gap-3">
              <a
                href={bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={NAV_PILL}
              >
                Prendre rendez-vous
              </a>

              <Link href="/contact" className={NAV_PILL}>
                Contact
              </Link>

              {/* Toggle en dernier */}
              <ThemeToggle className={NAV_PILL} />
            </div>

            {/* Mobile : bouton Menu (toggle dans le menu mobile si vous le souhaitez) */}
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className={`md:hidden ${NAV_PILL}`}
              aria-expanded={open}
              aria-controls="mobile-menu"
            >
              Menu
            </button>
          </div>

        </div>

        {/* Mobile menu */}
        <div
          id="mobile-menu"
          className={[
            "md:hidden overflow-hidden transition-[max-height,opacity] duration-200",
            open ? "max-h-[520px] opacity-100 pb-4" : "max-h-0 opacity-0",
          ].join(" ")}
        >
          <div className="grid gap-2 pt-2">
            {/* Menus mobiles : mêmes items + même style */}
            <ScrollNav items={nav} className={NAV_PILL} onNavigate={closeMenu} />

            {/* CTA mobiles : mêmes classes */}
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeMenu}
              className={NAV_PILL}
            >
              Prendre rendez-vous
            </a>

            <Link href="/contact" onClick={closeMenu as any} className={NAV_PILL}>
              Contact
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
