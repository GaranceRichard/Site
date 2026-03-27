// frontend/src/app/components/home/ReferencesSection.tsx
"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { Container, ELEVATED_PANEL_CLASS, MUTED_PANEL_CLASS, PANEL_CLASS, SectionTitle, cx } from "./ui";
import type { ReferenceItem } from "../../content/references";
import { fetchReferencesOnce, type ApiReference } from "../../lib/references";
import { isDemoMode, toDemoAssetUrl } from "../../lib/demo";
import { toProxiedMediaUrl } from "../../lib/media";

const ReferenceModal = dynamic(() => import("./ReferenceModal"), { ssr: false });

function pickMissionTitle(item: ApiReference): string {
  return item.results?.[0] ?? "";
}

function toReferenceItem(item: ApiReference): ReferenceItem {
  const imageSrc = item.image_thumb?.trim() ? item.image_thumb : item.image;
  const demoMode = isDemoMode();
  return {
    id: `ref-${item.id}`,
    nameCollapsed: item.reference_short?.trim() ? item.reference_short : item.reference,
    nameExpanded: item.reference,
    missionTitle: pickMissionTitle(item),
    label: "Référence",
    imageSrc: demoMode ? toDemoAssetUrl(imageSrc) : toProxiedMediaUrl(imageSrc),
    badgeSrc: (demoMode ? toDemoAssetUrl(item.icon) : toProxiedMediaUrl(item.icon)) || undefined,
    badgeAlt: item.icon ? "Icône" : undefined,
    situation: item.situation || "",
    tasks: item.tasks ?? [],
    actions: item.actions ?? [],
    results: item.results ?? [],
  };
}

export default function ReferencesSection() {
  const [items, setItems] = useState<ReferenceItem[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [modal, setModal] = useState<ReferenceItem | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, true>>({});

  useEffect(() => {
    let cancelled = false;

    const loadReferences = async () => {
      setIsLoading(true);
      try {
        const data = await fetchReferencesOnce();
        if (!cancelled) {
          setItems(data.map(toReferenceItem));
          setApiError(null);
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setApiError(error instanceof Error ? error.message : "Erreur inconnue");
          setItems([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadReferences();

    return () => {
      cancelled = true;
    };
  }, []);

  function markImageFailed(id: string) {
    setFailedImages((prev) => (prev[id] ? prev : { ...prev, [id]: true }));
  }

  const featuredItems = useMemo(() => items.slice(0, 4), [items]);

  if (!isLoading && items.length === 0) {
    return null;
  }

  return (
    <section id="references" className="border-b subtle-divider py-16 sm:py-20">
      <Container>
        <SectionTitle
          eyebrow="Preuves"
          title="Références, contexte et résultats"
          description="Des missions présentées comme des éléments de crédibilité: organisation, périmètre, contribution et résultats observables."
        />

        {isLoading ? (
          <p className="mt-6 text-sm [color:var(--text-muted)]">Chargement des références…</p>
        ) : null}

        {featuredItems.length > 0 ? (
          <div className="mt-10 grid gap-4 lg:grid-cols-[1.15fr,0.85fr]">
            <div className={cx(ELEVATED_PANEL_CLASS, "space-y-6")}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="eyebrow">Bloc de preuve</p>
                  <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em]">
                    Des interventions cadrées par le contexte et le résultat.
                  </h3>
                </div>
                <div className="ui-pill px-3 py-2 text-xs font-semibold">
                  {items.length} références actives
                </div>
              </div>
              <p className="text-sm leading-7 [color:var(--text-secondary)]">
                Chaque référence privilégie les éléments utiles à la confiance: organisation, enjeu, rôle assumé et résultat visible. Le détail complet reste accessible au clic.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                {featuredItems.map((r, index) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setModal(failedImages[r.id] ? { ...r, imageSrc: "" } : r)}
                    aria-label={`Ouvrir la mission : ${r.nameExpanded}`}
                    className={cx(index === 0 ? ELEVATED_PANEL_CLASS : PANEL_CLASS, "h-full text-left")}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="eyebrow">{r.label ?? "Reference"}</p>
                        <p className="mt-3 text-base font-semibold">{r.nameExpanded}</p>
                      </div>
                      {r.badgeSrc ? (
                        <div className="relative h-10 w-16 shrink-0 overflow-hidden opacity-80">
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={r.badgeSrc}
                              alt={r.badgeAlt ?? "Badge"}
                              className="h-full w-full object-contain"
                              loading="eager"
                              decoding="async"
                            />
                          </>
                        </div>
                      ) : null}
                    </div>

                    <p className="mt-4 text-sm font-medium [color:var(--text-primary)]">
                      {r.missionTitle || "Mission structurante"}
                    </p>
                    <p className="mt-3 line-clamp-3 text-sm leading-7 [color:var(--text-secondary)]">
                      {r.situation}
                    </p>

                    {r.results.length > 0 ? (
                      <div className={cx(MUTED_PANEL_CLASS, "mt-5 p-4")}>
                        <p className="eyebrow">Resultat</p>
                        <p className="mt-3 text-sm leading-7 [color:var(--text-secondary)]">
                          {r.results[0]}
                        </p>
                      </div>
                    ) : null}

                    <div className="mt-5 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.14em] [color:var(--text-muted)]">
                      <span>Ouvrir le dossier</span>
                      <span>Voir plus</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {items.slice(4).map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setModal(failedImages[r.id] ? { ...r, imageSrc: "" } : r)}
                  aria-label={`Ouvrir la mission : ${r.nameExpanded}`}
                  className={cx(PANEL_CLASS, "flex w-full items-start gap-4 text-left")}
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-muted)]">
                    {r.imageSrc && !failedImages[r.id] ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={r.imageSrc}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                          decoding="async"
                          onError={() => markImageFailed(r.id)}
                        />
                      </>
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <p className="eyebrow">{r.label ?? "Reference"}</p>
                    <p className="mt-2 text-sm font-semibold">{r.nameExpanded}</p>
                    <p className="mt-2 line-clamp-2 text-sm [color:var(--text-secondary)]">
                      {r.missionTitle || r.situation}
                    </p>
                  </div>
                </button>
              ))}

              {items.length > 4 ? (
                <div className={cx(MUTED_PANEL_CLASS, "text-sm [color:var(--text-secondary)]")}>
                  Les autres références suivent la même logique de lecture. Cliquer ouvre le détail complet avec situation, tâches, actions et résultats.
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {apiError ? (
          <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
            Impossible de charger les références. Vérifiez l’API.
          </p>
        ) : null}
      </Container>

      {modal ? <ReferenceModal item={modal} onClose={() => setModal(null)} /> : null}
    </section>
  );
}
