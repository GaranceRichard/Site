"use client";

import { useEffect, useState } from "react";
import { Container, SectionTitle } from "./ui";

export type Service = {
  title: string;
  points: readonly string[];
};

export default function ServicesSection({ services }: { services: readonly Service[] }) {
  const [activeService, setActiveService] = useState<Service | null>(null);

  useEffect(() => {
    if (!activeService) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveService(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeService]);

  return (
    <>
      <section id="services" className="py-16 sm:py-20">
        <Container>
          <div className="grid gap-10 md:grid-cols-12">
            <div className="md:col-span-5">
              <SectionTitle
                eyebrow="Publications"
                title="Trois formats, une même exigence"
                description="Des interventions calibrées : utiles, lisibles, et soutenables dans la durée."
              />

              <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-[0_1px_0_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900">
                <p className="text-sm font-semibold">Format type</p>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-neutral-600 dark:text-neutral-300">
                  <li>Diagnostic & cadrage</li>
                  <li>Accompagnement (4 à 12 semaines)</li>
                  <li>Restitution & plan d’ancrage</li>
                </ul>
              </div>
            </div>

            <div className="md:col-span-7">
              <div className="space-y-4">
                {services.map((service) => (
                  <button
                    key={service.title}
                    type="button"
                    onClick={() => setActiveService(service)}
                    className="flex w-full items-center justify-between gap-4 rounded-2xl border border-neutral-200 bg-white p-6 text-left shadow-[0_1px_0_rgba(0,0,0,0.04)] transition-colors hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
                    aria-haspopup="dialog"
                    aria-expanded={activeService?.title === service.title}
                  >
                    <span className="text-sm font-semibold">{service.title}</span>
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-sm text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200">
                      +
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {activeService ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-neutral-950/55 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="service-modal-title"
          onClick={() => setActiveService(null)}
        >
          <div
            className="w-full max-w-2xl rounded-3xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900 sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h3 id="service-modal-title" className="text-lg font-semibold sm:text-xl">
                {activeService.title}
              </h3>
              <button
                type="button"
                onClick={() => setActiveService(null)}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-neutral-200 text-lg text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-800"
                aria-label="Fermer la modale"
              >
                ×
              </button>
            </div>

            <ul className="mt-6 list-disc space-y-3 pl-5 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
              {activeService.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </>
  );
}
