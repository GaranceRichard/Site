// frontend/src/app/components/ScrollNav.tsx
"use client";

import type { MouseEvent } from "react";

type NavItem = { label: string; href: string };

export default function ScrollNav({
  items,
  className,
  onNavigate,
}: {
  items: NavItem[];
  className: string;
  onNavigate?: () => void;
}) {
  function onClick(e: MouseEvent<HTMLAnchorElement>, href: string) {
    e.preventDefault();

    const id = href.startsWith("#") ?href.slice(1) : href;
    const el = document.getElementById(id);
    if (!el) return;

    // Scroll fluide sans changer l'URL
    el.scrollIntoView({ behavior: "smooth", block: "start" });

    // Sécurité : pas de hash persistant dans la barre d'adresse
    if (window.location.hash) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }

    onNavigate?.();
  }

  return (
    <>
      {items.map((item) => (
        <a
          key={item.href}
          href={item.href}
          onClick={(e) => onClick(e, item.href)}
          className={className}
        >
          {item.label}
        </a>
      ))}
    </>
  );
}
