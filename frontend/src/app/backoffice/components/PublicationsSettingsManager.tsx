"use client";

import { FormEvent, useEffect, useState, useSyncExternalStore } from "react";
import {
  getPublicationsSettings,
  getPublicationsSettingsServer,
  type PublicationReferenceLink,
  subscribePublicationsSettings,
  type PublicationItem,
  type PublicationsSettings,
} from "../../content/publicationsSettings";
import { savePublicationsSettings } from "../../content/siteSettingsStore";
import { moveItem } from "./HomeSettingsManager";

type PublicationFormItem = PublicationItem & {
  links: PublicationReferenceLink[];
};

type PublicationsFormState = Omit<PublicationsSettings, "items"> & {
  items: PublicationFormItem[];
};

function getPublicationTabLabel(item: PublicationFormItem, index: number) {
  const trimmedTitle = item.title.trim();
  if (!trimmedTitle) {
    return `Publication ${index + 1}`;
  }
  return trimmedTitle.slice(0, 10);
}

function normalizeForSubmit(settings: PublicationsFormState): PublicationsSettings {
  const items = settings.items
    .map((item) => ({
      ...item,
      title: item.title.trim(),
      content: item.content.trim(),
      links: item.links
        .map((link) => ({
          ...link,
          title: link.title.trim(),
          url: link.url.trim(),
        }))
        .filter((link) => link.title || link.url)
        .slice(0, 3),
    }))
    .filter((item) => item.title || item.content)
    .slice(0, 4);

  return {
    title: settings.title.trim(),
    subtitle: settings.subtitle.trim(),
    highlight: {
      title: settings.highlight.title.trim(),
      content: settings.highlight.content.trim(),
    },
    items,
  };
}

function normalizeFormState(settings: PublicationsSettings): PublicationsFormState {
  return {
    ...settings,
    items: settings.items.map((item) => ({
      ...item,
      links: item.links ?? [],
    })),
  };
}

export default function PublicationsSettingsManager() {
  const [activeTab, setActiveTab] = useState<"titles" | "highlight" | "items">("titles");
  const [activeItemIndex, setActiveItemIndex] = useState(0);
  const persisted = useSyncExternalStore(
    subscribePublicationsSettings,
    getPublicationsSettings,
    getPublicationsSettingsServer,
  );
  const [form, setForm] = useState<PublicationsFormState>(() => normalizeFormState(persisted));
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setForm(normalizeFormState(persisted));
  }, [persisted]);

  useEffect(() => {
    setActiveItemIndex((current) => {
      if (form.items.length === 0) {
        return 0;
      }
      return Math.min(current, form.items.length - 1);
    });
  }, [form.items.length]);

  function updateItem(index: number, next: Partial<PublicationFormItem>) {
    setForm((prev) => {
      const items = prev.items.slice();
      items[index] = { ...items[index], ...next };
      return { ...prev, items };
    });
  }

  function updateItemLink(
    itemIndex: number,
    linkIndex: number,
    next: Partial<PublicationReferenceLink>,
  ) {
    setForm((prev) => {
      const items = prev.items.slice();
      const links = items[itemIndex].links.slice();
      links[linkIndex] = { ...links[linkIndex], ...next };
      items[itemIndex] = { ...items[itemIndex], links };
      return { ...prev, items };
    });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const normalized = normalizeForSubmit(form);
    if (
      !normalized.title ||
      !normalized.subtitle ||
      !normalized.highlight.title ||
      !normalized.highlight.content
    ) {
      setError("Le titre, le sous-titre et l'encart sont obligatoires.");
      return;
    }

    let token: string | null = null;
    try {
      token = sessionStorage.getItem("access_token");
    } catch {
      token = null;
    }

    if (!token) {
      setError("Connexion requise pour enregistrer ces changements.");
      return;
    }

    setIsSaving(true);
    try {
      await savePublicationsSettings(normalized, token);
      setMessage("Publications mises a jour.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'enregistrer les publications.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mt-6">
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">Publications</h3>
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          Editez le titre, le sous-titre, l encart et la liste des publications.
        </p>

        <form onSubmit={onSubmit} className="mt-5 grid gap-6">
          <div className="grid gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
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
                  onClick={() => setActiveTab("highlight")}
                  className={[
                    "rounded-t-lg border border-b-0 px-3 py-2 text-xs font-semibold",
                    activeTab === "highlight"
                      ? "border-neutral-300 bg-white text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50"
                      : "border-neutral-200 bg-white text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200",
                  ].join(" ")}
                >
                  Encart
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("items")}
                  className={[
                    "rounded-t-lg border border-b-0 px-3 py-2 text-xs font-semibold",
                    activeTab === "items"
                      ? "border-neutral-300 bg-white text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50"
                      : "border-neutral-200 bg-white text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200",
                  ].join(" ")}
                >
                  Publications
                </button>
              </div>
              {activeTab !== "items" ? (
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-lg bg-neutral-900 px-4 py-2 text-xs font-semibold text-white"
                >
                  {isSaving ? "Enregistrement..." : "Enregistrer"}
                </button>
              ) : null}
            </div>

            {activeTab === "titles" ? (
              <div className="grid gap-4">
                <label className="block">
                  <span className="text-sm font-semibold">Titre</span>
                  <input
                    type="text"
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
                    rows={4}
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

            {activeTab === "highlight" ? (
              <div className="grid gap-4">
                <label className="block">
                  <span className="text-sm font-semibold">Titre encart</span>
                  <input
                    type="text"
                    value={form.highlight.title}
                    onChange={(e) => {
                      const value = e.currentTarget.value;
                      setForm((prev) => ({
                        ...prev,
                        highlight: { ...prev.highlight, title: value },
                      }));
                    }}
                    className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold">Contenu encart</span>
                  <textarea
                    rows={5}
                    value={form.highlight.content}
                    onChange={(e) => {
                      const value = e.currentTarget.value;
                      setForm((prev) => ({
                        ...prev,
                        highlight: { ...prev.highlight, content: value },
                      }));
                    }}
                    className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950"
                  />
                </label>
              </div>
            ) : null}

            {activeTab === "items" ? (
              <div className="grid gap-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  {form.items.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {form.items.map((item, index) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setActiveItemIndex(index)}
                          className={[
                            "rounded-lg border px-3 py-2 text-xs font-semibold transition-colors",
                            activeItemIndex === index
                              ? "border-neutral-300 bg-neutral-100 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-50"
                              : "border-neutral-200 bg-white text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200",
                          ].join(" ")}
                        >
                          {getPublicationTabLabel(item, index)}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Aucune publication pour le moment.
                    </p>
                  )}
                  <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setForm((prev) => ({
                          ...prev,
                          items: [
                            ...prev.items,
                            {
                              id: `publication-${Date.now()}`,
                              title: "Nouvelle publication",
                              content: "",
                              links: [],
                            },
                          ],
                        }));
                        setActiveItemIndex(form.items.length);
                      }}
                      disabled={form.items.length >= 4}
                      className="rounded-lg border border-neutral-200 px-3 py-2 text-xs font-semibold disabled:opacity-50 dark:border-neutral-800"
                    >
                      Ajouter
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setForm((prev) => ({
                          ...prev,
                          items: prev.items.filter((_, i) => i !== activeItemIndex),
                        }));
                        setActiveItemIndex((current) =>
                          Math.max(0, Math.min(current, form.items.length - 2)),
                        );
                      }}
                      disabled={form.items.length === 0}
                      className="rounded-lg border border-neutral-200 px-3 py-2 text-xs font-semibold disabled:opacity-40 dark:border-neutral-800"
                    >
                      Supprimer
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="rounded-lg bg-neutral-900 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      {isSaving ? "Enregistrement..." : "Enregistrer"}
                    </button>
                  </div>
                </div>
                {form.items.length > 0 ? (
                  <>
                    {(() => {
                      const item = form.items[activeItemIndex];
                      const index = activeItemIndex;
                      const itemLinks = item.links;
                      return (
                        <div className="grid gap-2 rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
                          <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                            Publication {index + 1}
                          </p>
                      <label className="grid gap-1">
                        <span className="text-xs font-semibold">Titre publication</span>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => {
                            const value = e.currentTarget.value;
                            updateItem(index, { title: value });
                          }}
                          className="rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950"
                        />
                      </label>
                      <label className="grid gap-1">
                        <span className="text-xs font-semibold">Texte publication</span>
                        <textarea
                          rows={5}
                          value={item.content}
                          onChange={(e) => {
                            const value = e.currentTarget.value;
                            updateItem(index, { content: value });
                          }}
                          className="rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950"
                        />
                      </label>
                      <div className="grid gap-2 rounded-lg border border-dashed border-neutral-200 p-3 dark:border-neutral-800">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-semibold">Liens de reference</span>
                          <button
                            type="button"
                            onClick={() =>
                              updateItem(index, {
                                links: [
                                  ...itemLinks,
                                  {
                                    id: `${item.id}-link-${itemLinks.length + 1}`,
                                    title: "",
                                    url: "",
                                  },
                                ],
                              })
                            }
                            disabled={itemLinks.length >= 3}
                            className="rounded-lg border border-neutral-200 px-2 py-1 text-xs disabled:opacity-40 dark:border-neutral-800"
                          >
                            Ajouter un lien
                          </button>
                        </div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          Jusqu a 3 liens par publication.
                        </p>
                        {itemLinks.map((link, linkIndex) => (
                          <div
                            key={link.id}
                            className="grid gap-2 rounded-lg border border-neutral-200 p-3 dark:border-neutral-800"
                          >
                            <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
                              <label className="grid gap-1">
                                <span className="text-xs font-semibold">Titre du lien</span>
                                <input
                                  type="text"
                                  value={link.title}
                                  onChange={(e) => {
                                    const value = e.currentTarget.value;
                                    updateItemLink(index, linkIndex, { title: value });
                                  }}
                                  className="rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950"
                                />
                              </label>
                              <label className="grid gap-1">
                                <span className="text-xs font-semibold">URL</span>
                                <input
                                  type="url"
                                  value={link.url}
                                  onChange={(e) => {
                                    const value = e.currentTarget.value;
                                    updateItemLink(index, linkIndex, { url: value });
                                  }}
                                  className="rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950"
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() =>
                                  updateItem(index, {
                                    links: itemLinks.filter((_, currentIndex) => currentIndex !== linkIndex),
                                  })
                                }
                                className="w-fit rounded-lg border border-neutral-200 px-2 py-2 text-xs whitespace-nowrap md:ml-auto dark:border-neutral-800"
                              >
                                Supprimer le lien
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setForm((prev) => ({ ...prev, items: moveItem(prev.items, index, index - 1) }));
                            setActiveItemIndex(index - 1);
                          }}
                          disabled={index === 0}
                          className="rounded-lg border border-neutral-200 px-2 py-1 text-xs disabled:opacity-40 dark:border-neutral-800"
                        >
                          Monter
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setForm((prev) => ({ ...prev, items: moveItem(prev.items, index, index + 1) }));
                            setActiveItemIndex(index + 1);
                          }}
                          disabled={index === form.items.length - 1}
                          className="rounded-lg border border-neutral-200 px-2 py-1 text-xs disabled:opacity-40 dark:border-neutral-800"
                        >
                          Descendre
                        </button>
                      </div>
                        </div>
                      );
                    })()}
                  </>
                ) : null}
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
