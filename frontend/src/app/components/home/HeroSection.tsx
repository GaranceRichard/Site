// frontend/src/app/components/home/HeroSection.tsx
"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { fetchReferencesOnce } from "../../lib/references";
import {
  getHomeHeroSettings,
  getHomeHeroSettingsServer,
  subscribeHomeHeroSettings,
} from "../../content/homeHeroSettings";
import { Container } from "./ui";

export default function HeroSection() {
  const settings = useSyncExternalStore(
    subscribeHomeHeroSettings,
    getHomeHeroSettings,
    getHomeHeroSettingsServer,
  );

  const [hasReferences, setHasReferences] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadReferences = async () => {
      try {
        const refs = await fetchReferencesOnce();
        if (!cancelled) {
          setHasReferences(refs.length > 0);
        }
      } catch {
        if (!cancelled) {
          setHasReferences(false);
        }
      }
    };

    void loadReferences();

    return () => {
      cancelled = true;
    };
  }, []);

  const titleLines = useMemo(
    () =>
      settings.title
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    [settings.title],
  );

  const visibleLinks = useMemo(
    () =>
      settings.links.filter(
        (link) => link.enabled && (link.id !== "references" || hasReferences),
      ),
    [hasReferences, settings.links],
  );

  function toBullets(content: string): string[] {
    return content
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.replace(/^[-*•]\s*/, ""));
  }

  return (
    <section id="home" className="relative overflow-hidden">
      <div className="absolute inset-0 bg-neutral-50 dark:bg-neutral-950" />
      <div className="absolute inset-x-0 top-0 h-px bg-neutral-200 dark:bg-neutral-800" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-neutral-200 dark:bg-neutral-800" />

      <Container>
        <div className="relative grid gap-10 py-16 sm:py-20 md:grid-cols-12 md:items-start">
          <div className="md:col-span-7">
            <p className="text-sm font-medium tracking-wide text-neutral-600 dark:text-neutral-300">
              {settings.eyebrow}
            </p>

            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-6xl">
              {titleLines[0] ?? ""}
              {titleLines.slice(1).map((line, index) => (
                <span key={`${line}-${index}`} className="block text-neutral-500 dark:text-neutral-300">
                  {line}
                </span>
              ))}
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-neutral-600 dark:text-neutral-300">
              {settings.subtitle}
            </p>

            {visibleLinks.length > 0 ? (
              <div className="mt-8 flex flex-wrap items-center gap-3">
                {visibleLinks.map((link, index) => (
                  <a
                    key={link.id}
                    href={link.id === "message" ? "/contact" : `#${link.id}`}
                    className={
                      index === 0
                        ? "rounded-xl border border-neutral-200 bg-neutral-900 px-5 py-3 text-sm font-semibold text-white shadow-[0_1px_0_rgba(0,0,0,0.04)] hover:bg-neutral-800 dark:border-neutral-800"
                        : "rounded-xl border border-neutral-200 bg-white px-5 py-3 text-sm font-semibold shadow-[0_1px_0_rgba(0,0,0,0.04)] hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800"
                    }
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            ) : null}

            <div className="mt-10 flex flex-wrap justify-center gap-2">
              {settings.keywords.map((keyword, index) => (
                <span
                  key={`${keyword}-${index}`}
                  className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-4 py-1.5 text-sm font-medium text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>

          <div className="md:col-span-5">
            {settings.cards.map((card, index) => (
              <div
                key={card.id}
                className={
                  index === 0
                    ? "rounded-3xl border border-neutral-200 bg-white p-6 shadow-[0_1px_0_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900"
                    : "mt-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900"
                }
              >
                {card.title ? <p className="text-sm font-semibold">{card.title}</p> : null}
                {card.content ? (
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                    {toBullets(card.content).map((bullet, bulletIndex) => (
                      <li key={`${card.id}-bullet-${bulletIndex}`}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
