"use client";

import { FormEvent, useEffect, useState, useSyncExternalStore } from "react";
import {
  getHomeHeroSettings,
  getHomeHeroSettingsServer,
  setHomeHeroSettings,
  subscribeHomeHeroSettings,
  type HeroCard,
  type HeroSectionLink,
  type HomeHeroSettings,
} from "../../content/homeHeroSettings";

function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length || from === to) {
    return items;
  }
  const next = items.slice();
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

function normalizeForSubmit(settings: HomeHeroSettings): HomeHeroSettings {
  const keywords = settings.keywords.map((k) => k.trim()).filter(Boolean).slice(0, 5);
  const cards = settings.cards
    .map((card) => ({
      ...card,
      title: card.title.trim(),
      content: card.content.trim(),
    }))
    .filter((card) => card.title || card.content)
    .slice(0, 4);

  return {
    eyebrow: settings.eyebrow.trim(),
    title: settings.title.trim(),
    subtitle: settings.subtitle.trim(),
    links: settings.links.map((link) => ({
      ...link,
      label: link.label.trim(),
    })),
    keywords,
    cards,
  };
}

export default function HomeSettingsManager() {
  const [activeTab, setActiveTab] = useState<"titles" | "cards" | "links-keywords">("titles");
  const persisted = useSyncExternalStore(
    subscribeHomeHeroSettings,
    getHomeHeroSettings,
    getHomeHeroSettingsServer,
  );
  const [form, setForm] = useState<HomeHeroSettings>(persisted);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm(persisted);
  }, [persisted]);

  function updateLink(index: number, next: Partial<HeroSectionLink>) {
    setForm((prev) => {
      const links = prev.links.slice();
      links[index] = { ...links[index], ...next };
      return { ...prev, links };
    });
  }

  function updateCard(index: number, next: Partial<HeroCard>) {
    setForm((prev) => {
      const cards = prev.cards.slice();
      cards[index] = { ...cards[index], ...next };
      return { ...prev, cards };
    });
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const normalized = normalizeForSubmit(form);
    if (!normalized.eyebrow || !normalized.title || !normalized.subtitle) {
      setError("Sur-titre, titre et sous-titre sont obligatoires.");
      return;
    }
    if (normalized.keywords.length < 1 || normalized.keywords.length > 5) {
      setError("Il faut entre 1 et 5 mots-cles.");
      return;
    }

    setHomeHeroSettings(normalized);
    setMessage("Accueil mis a jour.");
  }

  return (
    <div className="mt-6">
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">Accueil</h3>
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          Editez le hero, les liens, les mots-cles et les encarts de la page d accueil.
        </p>

        <form onSubmit={onSubmit} className="mt-5 grid gap-6">
          <div className="grid gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-end gap-1">
                <div className="flex flex-wrap items-end gap-1">
              <button
                type="button"
                onClick={() => setActiveTab("titles")}
                className={[
                  "rounded-t-lg border border-b-0 px-3 py-2 text-xs font-semibold",
                  activeTab === "titles"
                    ? "border-neutral-300 bg-white text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50"
                    : "border-neutral-200 bg-white text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200",
                ].join(" ")}
              >
                Titres
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("cards")}
                className={[
                  "rounded-t-lg border border-b-0 px-3 py-2 text-xs font-semibold",
                  activeTab === "cards"
                    ? "border-neutral-300 bg-white text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50"
                    : "border-neutral-200 bg-white text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200",
                ].join(" ")}
              >
                Encarts
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("links-keywords")}
                className={[
                  "rounded-t-lg border border-b-0 px-3 py-2 text-xs font-semibold",
                  activeTab === "links-keywords"
                    ? "border-neutral-300 bg-white text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50"
                    : "border-neutral-200 bg-white text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200",
                ].join(" ")}
              >
                Liens et mots clefs
              </button>
                </div>
              </div>
              <button
                type="submit"
                className="rounded-lg bg-neutral-900 px-4 py-2 text-xs font-semibold text-white"
              >
                Enregistrer
              </button>
            </div>

            {activeTab === "titles" ? (
              <div className="grid gap-4">
                <label className="block">
                  <span className="text-sm font-semibold">Sur-titre</span>
                  <input
                    type="text"
                    value={form.eyebrow}
                    onChange={(e) => {
                      const value = e.currentTarget.value;
                      setForm((prev) => ({ ...prev, eyebrow: value }));
                    }}
                    className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold">Titre</span>
                  <textarea
                    rows={3}
                    value={form.title}
                    onChange={(e) => {
                      const value = e.currentTarget.value;
                      setForm((prev) => ({ ...prev, title: value }));
                    }}
                    className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold">Sous-titre</span>
                  <textarea
                    rows={3}
                    value={form.subtitle}
                    onChange={(e) => {
                      const value = e.currentTarget.value;
                      setForm((prev) => ({ ...prev, subtitle: value }));
                    }}
                    className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950"
                  />
                </label>
              </div>
            ) : null}

            {activeTab === "cards" ? (
              <div className="grid gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      cards: [
                        ...prev.cards,
                        { id: `card-${Date.now()}`, title: "Nouvel encart", content: "" },
                      ],
                    }))
                  }
                  disabled={form.cards.length >= 4}
                  className="w-fit rounded-lg border border-neutral-200 px-3 py-1 text-xs font-semibold disabled:opacity-50 dark:border-neutral-800"
                >
                  Ajouter
                </button>
                <div className="grid gap-3 md:grid-cols-2">
                  {form.cards.map((card, index) => (
                    <div
                      key={card.id}
                      className="grid gap-2 rounded-lg border border-neutral-200 p-3 dark:border-neutral-800"
                    >
                      <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                        Encart {index + 1}
                      </p>
                      <label className="grid gap-1">
                        <span className="text-xs font-semibold">Titre encart</span>
                        <input
                          type="text"
                          value={card.title}
                          onChange={(e) => updateCard(index, { title: e.currentTarget.value })}
                          className="rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950"
                        />
                      </label>
                      <label className="grid gap-1">
                        <span className="text-xs font-semibold">Contenu (1 ligne = 1 puce)</span>
                        <textarea
                          rows={5}
                          value={card.content}
                          onChange={(e) => updateCard(index, { content: e.currentTarget.value })}
                          className="rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950"
                        />
                      </label>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({ ...prev, cards: moveItem(prev.cards, index, index - 1) }))
                          }
                          disabled={index === 0}
                          className="rounded-lg border border-neutral-200 px-2 py-1 text-xs disabled:opacity-40 dark:border-neutral-800"
                        >
                          Monter
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({ ...prev, cards: moveItem(prev.cards, index, index + 1) }))
                          }
                          disabled={index === form.cards.length - 1}
                          className="rounded-lg border border-neutral-200 px-2 py-1 text-xs disabled:opacity-40 dark:border-neutral-800"
                        >
                          Descendre
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              cards: prev.cards.filter((_, i) => i !== index),
                            }))
                          }
                          className="rounded-lg border border-neutral-200 px-2 py-1 text-xs dark:border-neutral-800"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {activeTab === "links-keywords" ? (
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <p className="text-sm font-semibold">Liens vers sections (activables)</p>
                  <div className="grid gap-3 md:grid-cols-3">
                    {form.links.map((link, index) => (
                      <div
                        key={link.id}
                        className="grid gap-2 rounded-lg border border-neutral-200 p-3 dark:border-neutral-800"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                            {index + 1}. #{link.id}
                          </span>
                          <label className="flex items-center gap-2 text-xs">
                            <input
                              type="checkbox"
                              checked={link.enabled}
                              onChange={(e) => updateLink(index, { enabled: e.currentTarget.checked })}
                            />
                            Actif
                          </label>
                        </div>
                        <input
                          type="text"
                          value={link.label}
                          onChange={(e) => updateLink(index, { label: e.currentTarget.value })}
                          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950"
                        />
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setForm((prev) => ({
                                ...prev,
                                links: moveItem(prev.links, index, index - 1),
                              }))
                            }
                            disabled={index === 0}
                            className="rounded-lg border border-neutral-200 px-2 py-1 text-xs disabled:opacity-40 dark:border-neutral-800"
                          >
                            Monter
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setForm((prev) => ({
                                ...prev,
                                links: moveItem(prev.links, index, index + 1),
                              }))
                            }
                            disabled={index === form.links.length - 1}
                            className="rounded-lg border border-neutral-200 px-2 py-1 text-xs disabled:opacity-40 dark:border-neutral-800"
                          >
                            Descendre
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">Mots-cles (1 a 5)</p>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({ ...prev, keywords: [...prev.keywords, ""] }))
                      }
                      disabled={form.keywords.length >= 5}
                      className="rounded-lg border border-neutral-200 px-3 py-1 text-xs font-semibold disabled:opacity-50 dark:border-neutral-800"
                    >
                      Ajouter
                    </button>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    {form.keywords.map((keyword, index) => (
                      <div
                        key={`keyword-${index}`}
                        className="grid gap-2 rounded-lg border border-neutral-200 p-3 dark:border-neutral-800"
                      >
                        <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                          {index + 1}. mot-cle
                        </span>
                        <input
                          type="text"
                          value={keyword}
                          onChange={(e) => {
                            const value = e.currentTarget.value;
                            setForm((prev) => {
                              const next = prev.keywords.slice();
                              next[index] = value;
                              return { ...prev, keywords: next };
                            });
                          }}
                          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950"
                        />
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setForm((prev) => ({
                                ...prev,
                                keywords: moveItem(prev.keywords, index, index - 1),
                              }))
                            }
                            disabled={index === 0}
                            className="rounded-lg border border-neutral-200 px-2 py-1 text-xs disabled:opacity-40 dark:border-neutral-800"
                          >
                            Monter
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setForm((prev) => ({
                                ...prev,
                                keywords: moveItem(prev.keywords, index, index + 1),
                              }))
                            }
                            disabled={index === form.keywords.length - 1}
                            className="rounded-lg border border-neutral-200 px-2 py-1 text-xs disabled:opacity-40 dark:border-neutral-800"
                          >
                            Descendre
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setForm((prev) => ({
                                ...prev,
                                keywords: prev.keywords.filter((_, i) => i !== index),
                              }))
                            }
                            disabled={form.keywords.length <= 1}
                            className="rounded-lg border border-neutral-200 px-2 py-1 text-xs disabled:opacity-40 dark:border-neutral-800"
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </p>
          ) : null}
          {message ? (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-200">
              {message}
            </p>
          ) : null}

        </form>
      </div>
    </div>
  );
}
