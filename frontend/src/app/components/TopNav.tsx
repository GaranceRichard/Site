// frontend/src/app/components/TopNav.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import ScrollNav from "./ScrollNav";
import ThemeToggle from "./ThemeToggle";
import { isBackofficeEnabled } from "../lib/backoffice";

type NavItem = { label: string; href: string };

export default function TopNav({
  nav,
  bookingUrl,
}: {
  nav: NavItem[];
  bookingUrl: string;
}) {
  const router = useRouter();
  const backofficeEnabled = isBackofficeEnabled();
  const [open, setOpen] = useState(false);
  const [isLogged, setIsLogged] = useState(false);
  const [hasReferences, setHasReferences] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ✅ “Connecté” si token présent
  useEffect(() => {
    let cancelled = false;

    const compute = () => {
      try {
        return Boolean(sessionStorage.getItem("access_token"));
      } catch {
        return false;
      }
    };

    const update = () => {
      if (cancelled) return;
      setIsLogged(compute());
    };

    if (typeof queueMicrotask === "function") {
      queueMicrotask(update);
    } else {
      window.setTimeout(update, 0);
    }

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadReferences = async () => {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!apiBase) {
        setHasReferences(false);
        return;
      }

      try {
        const res = await fetch(`${apiBase}/api/contact/references`);
        if (!res.ok) {
          setHasReferences(false);
          return;
        }
        const data = (await res.json()) as unknown;
        if (!cancelled && Array.isArray(data) && data.length > 0) {
          setHasReferences(true);
        } else if (!cancelled) {
          setHasReferences(false);
        }
      } catch {
        if (!cancelled) setHasReferences(false);
      }
    };

    void loadReferences();
    return () => {
      cancelled = true;
    };
  }, []);

  const navItems = useMemo(() => {
    if (hasReferences) return nav;
    return nav.filter((item) => !item.href.includes("references"));
  }, [hasReferences, nav]);

  const NAV_PILL =
    "inline-flex items-center justify-center whitespace-nowrap rounded-xl border border-neutral-200 bg-white px-2.5 py-1 text-sm font-semibold text-neutral-900 shadow-[0_1px_0_rgba(0,0,0,0.04)] hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-50 dark:hover:bg-neutral-800";

  function closeMenu() {
    setOpen(false);
  }

  function onBrandClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();

    // Re-check au clic (au cas où le token vient d’être posé)
    let logged = false;
    try {
      logged = Boolean(sessionStorage.getItem("access_token"));
      setIsLogged(logged);
    } catch {
      logged = false;
      setIsLogged(false);
    }

    if (logged && backofficeEnabled) {
      router.push("/backoffice");
      return;
    }

    // Sinon : scroll vers home (comportement “logo = haut de page / accueil”)
    const el = document.getElementById("home");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });

    if (window.location.hash) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-neutral-50/85 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/75">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <div className="flex h-[72px] items-center justify-between gap-6">
          {/* Branding (logo) : si connecté + backoffice activé -> /backoffice, sinon scroll home */}
          <button
            type="button"
            onClick={onBrandClick}
            className="flex min-w-0 items-center gap-3 text-left"
            aria-label={isLogged && backofficeEnabled ? "Aller au backoffice" : "Aller à l’accueil"}
            title={isLogged && backofficeEnabled ? "Backoffice" : "Accueil"}
          >
            <Image
              src="/brand/logo.png"
              alt="Garance Richard"
              width={48}
              height={48}
              priority
              className="h-12 w-12 object-contain"
            />

            <div className="min-w-0 leading-tight">
              <p className="text-sm font-semibold">Garance Richard</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Coach Lean-Agile</p>
            </div>
          </button>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-3 md:flex">
            <ScrollNav items={navItems} className={NAV_PILL} />
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3">
              <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className={NAV_PILL}>
                Prendre rendez-vous
              </a>

              <Link href="/contact" className={NAV_PILL}>
                Contact
              </Link>

              <ThemeToggle className={`${NAV_PILL} shrink-0`} />
            </div>

            {/* Mobile : bouton Menu */}
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
            open ? "max-h-[620px] opacity-100 pb-4" : "max-h-0 opacity-0",
          ].join(" ")}
        >
          <div className="grid gap-2 pt-2">
            <ScrollNav items={navItems} className={NAV_PILL} onNavigate={closeMenu} />

            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeMenu}
              className={NAV_PILL}
            >
              Prendre rendez-vous
            </a>

            <Link href="/contact" onClick={() => closeMenu()} className={NAV_PILL}>
              Contact
            </Link>

            <ThemeToggle className={NAV_PILL} />
          </div>
        </div>
      </div>
    </header>
  );
}
