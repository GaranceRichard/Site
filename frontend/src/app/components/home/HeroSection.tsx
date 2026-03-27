"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { ANALYTICS_EVENTS, trackEvent } from "../../lib/analytics";
import { isDemoMode } from "../../lib/demo";
import { fetchReferencesOnce } from "../../lib/references";
import {
  getHomeHeroSettings,
  getHomeHeroSettingsServer,
  subscribeHomeHeroSettings,
} from "../../content/homeHeroSettings";
import {
  Container,
  InlinePill,
  PrimaryButton,
  SecondaryButton,
  cx,
} from "./ui";

export default function HeroSection() {
  const demoMode = isDemoMode();
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
        (link) =>
          link.enabled &&
          (!demoMode || link.id !== "message") &&
          (link.id !== "references" || hasReferences),
      ),
    [demoMode, hasReferences, settings.links],
  );

  function toBullets(content: string): string[] {
    return content
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.replace(/^[-*•]\s*/, ""));
  }

  return (
    <section id="home" className="section-band relative overflow-hidden border-b subtle-divider">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(148,163,184,0.16),transparent_30%),linear-gradient(180deg,color-mix(in_srgb,var(--surface-muted)_56%,transparent),transparent_68%)]" />

      <Container>
        <div className="relative grid gap-12 py-16 sm:py-20 md:grid-cols-12 md:items-start">
          <div className="md:col-span-7">
            <p className="eyebrow">{settings.eyebrow}</p>

            <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-[-0.05em] text-balance sm:text-6xl lg:text-[4.5rem]">
              {titleLines[0] ?? ""}
              {titleLines.slice(1).map((line, index) => (
                <span key={`${line}-${index}`} className="mt-1 block [color:var(--text-secondary)]">
                  {line}
                </span>
              ))}
            </h1>

            <p className="section-copy mt-7 max-w-2xl text-base sm:text-lg">{settings.subtitle}</p>

            {visibleLinks.length > 0 ? (
              <div className="mt-8 flex flex-wrap items-center gap-3">
                {visibleLinks.map((link, index) =>
                  index === 0 ? (
                    <PrimaryButton
                      key={link.id}
                      href={link.id === "message" ? "/contact" : `#${link.id}`}
                      onClick={() =>
                        trackEvent(ANALYTICS_EVENTS.CTA_CLICK, {
                          cta_label: link.label,
                          cta_location: "hero",
                        })
                      }
                    >
                      {link.label}
                    </PrimaryButton>
                  ) : (
                    <SecondaryButton
                      key={link.id}
                      href={link.id === "message" ? "/contact" : `#${link.id}`}
                      onClick={() =>
                        trackEvent(ANALYTICS_EVENTS.CTA_CLICK, {
                          cta_label: link.label,
                          cta_location: "hero",
                        })
                      }
                    >
                      {link.label}
                    </SecondaryButton>
                  ),
                )}
              </div>
            ) : null}

            <div className="mt-10 flex flex-wrap gap-2">
              {settings.keywords.map((keyword, index) => (
                <InlinePill key={`${keyword}-${index}`}>{keyword}</InlinePill>
              ))}
            </div>
          </div>

          <div className="space-y-4 md:col-span-5">
            {settings.cards.map((card) => (
              <div key={card.id} className={cx("panel p-5", "relative")}>
                {card.title ? <p className="text-sm font-semibold">{card.title}</p> : null}
                {card.content ? (
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 [color:var(--text-secondary)]">
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
