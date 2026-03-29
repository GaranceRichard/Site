"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import {
  getPublicationsSettings,
  getPublicationsSettingsServer,
  type PublicationReferenceLink,
  subscribePublicationsSettings,
} from "../../content/publicationsSettings";
import { slugifySegment } from "../../lib/siteContent";
import {
  Container,
  ELEVATED_PANEL_CLASS,
  MUTED_PANEL_CLASS,
  PANEL_CLASS,
  SectionTitle,
  cx,
} from "./ui";

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
    .map((line) => line.replace(/^[-*\u2022]\s*/, ""));
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
      <section id="services" className="border-b subtle-divider py-16 sm:py-20">
        <Container>
          <div className="grid gap-10 md:grid-cols-12">
            <div className="md:col-span-5">
              <SectionTitle
                eyebrow="Publications"
                title={settings.title}
                description={settings.subtitle}
              />

              <div className={cx(ELEVATED_PANEL_CLASS, "mt-6")}>
                <p className="eyebrow">Repere</p>
                <p className="mt-3 text-base font-semibold">{settings.highlight.title}</p>
                <ul className="mt-4 list-disc space-y-2 pl-5 text-sm [color:var(--text-secondary)]">
                  {toBullets(settings.highlight.content).map((point, index) => (
                    <li key={`highlight-${index}`}>{point}</li>
                  ))}
                </ul>
                <div className="mt-6">
                  <Link href="/publications" className="primary-button px-4 py-2 text-sm">
                    Voir toutes les publications
                  </Link>
                </div>
              </div>
            </div>

            <div className="md:col-span-7">
              <div className="space-y-4">
                {settings.items.map((item, index) => (
                  <div key={item.id} className={cx(PANEL_CLASS, "space-y-4")}>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveService({
                          title: item.title,
                          content: item.content,
                          links: item.links ?? [],
                        })
                      }
                      className="flex w-full items-center justify-between gap-4 text-left hover:border-[color:var(--border-strong)]"
                      aria-haspopup="dialog"
                      aria-expanded={activeService?.title === item.title}
                    >
                      <div>
                        <p className="eyebrow">Publication</p>
                        <span className="mt-3 block text-sm font-semibold">{item.title}</span>
                      </div>
                      <span className="ui-pill inline-flex h-8 w-8 shrink-0 items-center justify-center text-sm">
                        +
                      </span>
                    </button>
                    <div className="flex justify-end">
                      <Link
                        href={`/publications/${slugifySegment(item.title || item.id)}-${index + 1}`}
                        className="ui-pill px-3 py-2 text-xs font-semibold"
                      >
                        Lire la publication
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {activeService ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="service-modal-title"
          onClick={() => setActiveService(null)}
        >
          <div
            className={cx(ELEVATED_PANEL_CLASS, "flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden sm:p-8")}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h3 id="service-modal-title" className="text-lg font-semibold sm:text-xl">
                {activeService.title}
              </h3>
              <button
                type="button"
                onClick={() => setActiveService(null)}
                className="ui-pill inline-flex h-10 w-10 shrink-0 items-center justify-center text-lg"
                aria-label="Fermer la modale"
              >
                x
              </button>
            </div>

            <p className="mt-6 overflow-y-auto whitespace-pre-line text-sm leading-relaxed [color:var(--text-secondary)]">
              {activeService.content}
            </p>
            {activeService.links.length > 0 ? (
              <div className={cx(MUTED_PANEL_CLASS, "mt-6 pt-4")}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] [color:var(--text-muted)]">
                  References
                </p>
                <div className="mt-3 flex flex-col gap-2">
                  {activeService.links.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-semibold underline underline-offset-4 [color:var(--text-primary)] decoration-[color:var(--border-strong)] hover:[color:var(--text-secondary)]"
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
