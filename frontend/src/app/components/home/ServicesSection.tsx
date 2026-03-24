"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  getPublicationsSettings,
  getPublicationsSettingsServer,
  type PublicationReferenceLink,
  subscribePublicationsSettings,
} from "../../content/publicationsSettings";
import { Container, SectionTitle } from "./ui";

type PublicationModalItem = {
  title: string;
  content: string;
  links: PublicationReferenceLink[];
};

function toBullets(content: string): string[] {
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[-*•]\s*/, ""));
}

export default function ServicesSection() {
  const settings = useSyncExternalStore(
    subscribePublicationsSettings,
    getPublicationsSettings,
    getPublicationsSettingsServer,
  );
  const [activeService, setActiveService] = useState<PublicationModalItem | null>(null);

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
                title={settings.title}
                description={settings.subtitle}
              />

              <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-[0_1px_0_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900">
                <p className="text-sm font-semibold">{settings.highlight.title}</p>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-neutral-600 dark:text-neutral-300">
                  {toBullets(settings.highlight.content).map((point, index) => (
                    <li key={`highlight-${index}`}>{point}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="md:col-span-7">
              <div className="space-y-4">
                {settings.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      setActiveService({
                        title: item.title,
                        content: item.content,
                        links: item.links ?? [],
                      })
                    }
                    className="flex w-full items-center justify-between gap-4 rounded-2xl border border-neutral-200 bg-white p-6 text-left shadow-[0_1px_0_rgba(0,0,0,0.04)] transition-colors hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
                    aria-haspopup="dialog"
                    aria-expanded={activeService?.title === item.title}
                  >
                    <span className="text-sm font-semibold">{item.title}</span>
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
            className="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-neutral-900 sm:p-8"
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
                x
              </button>
            </div>

            <p className="mt-6 overflow-y-auto whitespace-pre-line text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
              {activeService.content}
            </p>
            {activeService.links.length > 0 ? (
              <div className="mt-6 border-t border-neutral-200 pt-4 dark:border-neutral-800">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">
                  References
                </p>
                <div className="mt-3 flex flex-col gap-2">
                  {activeService.links.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-semibold text-neutral-900 underline decoration-neutral-300 underline-offset-4 transition-colors hover:text-neutral-600 dark:text-neutral-50 dark:decoration-neutral-700 dark:hover:text-neutral-300"
                    >
                      {link.title}
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
