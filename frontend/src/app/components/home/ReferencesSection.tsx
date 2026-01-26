// frontend/src/app/components/home/ReferencesSection.tsx
"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { Container, SectionTitle } from "./ui";
import { REFERENCES, type ReferenceItem } from "../../content/references";
import ReferenceModal from "./ReferenceModal";

export default function ReferencesSection() {
  const items = useMemo(() => REFERENCES, []);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [modal, setModal] = useState<ReferenceItem | null>(null);

  const desktopWrapRef = useRef<HTMLDivElement | null>(null);

  function clearActive() {
    setActiveIndex(null);
  }

  return (
    <section id="references" className="py-16 sm:py-20">
      <Container>
        <SectionTitle
          eyebrow="Références"
          title="Ils m’ont fait confiance"
          description="Survolez pour parcourir, cliquez pour ouvrir la description de mission."
        />

        {/* Desktop — Accordéon horizontal */}
        <div className="mt-10 hidden md:block">
          <div
            ref={desktopWrapRef}
            className="flex h-[420px] gap-1"
            onMouseLeave={clearActive}
            onBlurCapture={(e) => {
              const next = e.relatedTarget as Node | null;
              if (desktopWrapRef.current && next && desktopWrapRef.current.contains(next)) return;
              clearActive();
            }}
          >
            {items.map((r, i) => {
              const isActive = activeIndex === i;

              return (
                <button
                  key={r.id}
                  type="button"
                  onMouseEnter={() => setActiveIndex(i)}
                  onFocus={() => setActiveIndex(i)}
                  onClick={() => setModal(r)}
                  aria-label={`Ouvrir la mission : ${r.nameExpanded}`}
                  aria-expanded={isActive}
                  className={[
                    "group relative overflow-hidden rounded-3xl border border-neutral-200 bg-white text-left",
                    "shadow-[0_1px_0_rgba(0,0,0,0.04)] hover:shadow-lg",
                    "dark:border-neutral-800 dark:bg-neutral-900",
                    "transition-[flex,box-shadow,transform,filter] duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
                    "focus:outline-none focus:ring-2 focus:ring-neutral-400/40",
                  ].join(" ")}
                  style={{ flex: isActive ?6 : 1 }}
                >
                  {/* Image plein cadre */}
                  <div className="absolute inset-0">
                    <Image
                      src={r.imageSrc}
                      alt=""
                      fill
                      sizes="(min-width: 768px) 33vw, 100vw"
                      className={[
                        "object-cover",
                        "transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                        isActive ?"scale-100" : "scale-[0.99]",
                      ].join(" ")}
                      priority={false}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
                  </div>

                  {/* Contenu : layout stable => textes alignés */}
                  <div className="relative h-full p-6">
                    <div className="grid h-full content-end gap-2">
                      {/* Ligne 1 : nom */}
                      <p className="text-lg font-semibold text-white">
                        {isActive ?r.nameExpanded : r.nameCollapsed}
                      </p>

                      {/* Ligne 2 : mission (1 ligne, hauteur fixe) */}
                      <div className="h-5 overflow-hidden">
                        <p
                          className={[
                            "text-sm leading-5 text-white/85 line-clamp-1",
                            "transition-all duration-300",
                            isActive ?"opacity-100 translate-y-0" : "opacity-0 translate-y-1",
                          ].join(" ")}
                        >
                          {r.missionTitle}
                        </p>
                      </div>

                      {/* Ligne 3 : CTA (hauteur fixe) */}
                      <div className="h-5 pt-2">
                        <div
                          className={[
                            "text-xs font-semibold text-white/85",
                            "transition-opacity duration-300",
                            isActive ?"opacity-100" : "opacity-0",
                          ].join(" ")}
                        >
                          Voir la mission →
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <p className="mt-4 text-xs text-neutral-500 dark:text-neutral-400">
            Astuce : survolez pour parcourir, cliquez pour ouvrir le détail.
          </p>
        </div>

        {/* Mobile — Carousel snap */}
        <div className="mt-10 md:hidden">
          <div className="-mx-5 overflow-x-auto px-5 pb-2">
            <div className="flex snap-x snap-mandatory gap-3">
              {items.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setModal(r)}
                  className={[
                    "snap-start",
                    "relative min-w-[84%] overflow-hidden rounded-3xl border border-neutral-200 bg-white text-left",
                    "shadow-[0_1px_0_rgba(0,0,0,0.04)]",
                    "dark:border-neutral-800 dark:bg-neutral-900",
                  ].join(" ")}
                >
                  <div className="relative h-[240px] w-full">
                    <Image
                      src={r.imageSrc}
                      alt=""
                      fill
                      sizes="90vw"
                      className="object-cover"
                      priority={false}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
                  </div>

                  <div className="relative p-5">
                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                      {r.nameExpanded}
                    </p>
                    <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
                      {r.missionTitle}
                    </p>
                    <p className="mt-4 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                      Voir la mission →
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Container>

      <ReferenceModal item={modal} onClose={() => setModal(null)} />
    </section>
  );
}
