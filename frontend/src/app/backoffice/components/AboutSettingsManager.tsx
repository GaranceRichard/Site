"use client";

import { FormEvent, useEffect, useState, useSyncExternalStore } from "react";
import {
  getAboutSettings,
  getAboutSettingsServer,
  subscribeAboutSettings,
  type AboutHighlightItem,
  type AboutSettings,
} from "../../content/aboutSettings";
import { saveAboutSettings } from "../../content/siteSettingsStore";
import { moveItem } from "./HomeSettingsManager";

function normalizeForSubmit(settings: AboutSettings): AboutSettings {
  return {
    title: settings.title.trim(),
    subtitle: settings.subtitle.trim(),
    highlight: {
      intro: settings.highlight.intro.trim(),
      items: settings.highlight.items
        .map((item, index) => ({
          id: item.id.trim() || `about-item-${index + 1}`,
          text: item.text.trim(),
        }))
        .filter((item) => item.text)
        .slice(0, 4),
    },
  };
}

export default function AboutSettingsManager() {
  const persisted = useSyncExternalStore(
    subscribeAboutSettings,
    getAboutSettings,
    getAboutSettingsServer,
  );
  const [form, setForm] = useState<AboutSettings>(persisted);
  const [activeItemIndex, setActiveItemIndex] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setForm(persisted);
  }, [persisted]);

  useEffect(() => {
    setActiveItemIndex((current) => {
      if (form.highlight.items.length === 0) {
        return 0;
      }
      return Math.min(current, form.highlight.items.length - 1);
    });
  }, [form.highlight.items.length]);

  function updateItem(index: number, next: Partial<AboutHighlightItem>) {
    setForm((prev) => {
      const items = prev.highlight.items.slice();
      items[index] = { ...items[index], ...next };
      return {
        ...prev,
        highlight: {
          ...prev.highlight,
          items,
        },
      };
    });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const normalized = normalizeForSubmit(form);
    if (!normalized.title || !normalized.subtitle || !normalized.highlight.intro) {
      setError("Le titre, le sous-titre et le paragraphe de presentation sont obligatoires.");
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
      await saveAboutSettings(normalized, token);
      setMessage("Section A propos mise a jour.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'enregistrer la section A propos.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mt-6">
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">A propos</h3>
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          Editez le titre, le sous-titre, le paragraphe de presentation et jusqu a 4 encadres.
        </p>

        <form onSubmit={onSubmit} className="mt-5 grid gap-6">
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

            <label className="block">
              <span className="text-sm font-semibold">Paragraphe de presentation</span>
              <textarea
                rows={5}
                value={form.highlight.intro}
                onChange={(e) => {
                  const value = e.currentTarget.value;
                  setForm((prev) => ({
                    ...prev,
                    highlight: { ...prev.highlight, intro: value },
                  }));
                }}
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950"
              />
            </label>
          </div>

          <div className="grid gap-3 rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Encadres</p>
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  Jusqu a 4 encadres, affiches sur 2 colonnes. Gardez une seule ligne par encadre.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setForm((prev) => ({
                      ...prev,
                      highlight: {
                        ...prev.highlight,
                        items: [
                          ...prev.highlight.items,
                          {
                            id: `about-item-${Date.now()}`,
                            text: "",
                          },
                        ],
                      },
                    }));
                    setActiveItemIndex(form.highlight.items.length);
                  }}
                  disabled={form.highlight.items.length >= 4}
                  className="rounded-lg border border-neutral-200 px-3 py-2 text-xs font-semibold disabled:opacity-50 dark:border-neutral-800"
                >
                  Ajouter
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setForm((prev) => ({
                      ...prev,
                      highlight: {
                        ...prev.highlight,
                        items: prev.highlight.items.filter((_, index) => index !== activeItemIndex),
                      },
                    }));
                    setActiveItemIndex((current) =>
                      Math.max(0, Math.min(current, form.highlight.items.length - 2)),
                    );
                  }}
                  disabled={form.highlight.items.length === 0}
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

            {form.highlight.items.length > 0 ? (
              <>
                <div className="flex flex-wrap gap-2">
                  {form.highlight.items.map((item, index) => (
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
                      {`Encadre ${index + 1}`}
                    </button>
                  ))}
                </div>

                {(() => {
                  const activeItem = form.highlight.items[activeItemIndex];

                  return (
                    <div className="grid gap-3 rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
                      <label className="grid gap-1">
                        <span className="text-xs font-semibold">Texte encadre</span>
                        <input
                          type="text"
                          value={activeItem.text}
                          onChange={(e) => {
                            updateItem(activeItemIndex, { text: e.currentTarget.value });
                          }}
                          className="rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950"
                        />
                      </label>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setForm((prev) => ({
                              ...prev,
                              highlight: {
                                ...prev.highlight,
                                items: moveItem(prev.highlight.items, activeItemIndex, activeItemIndex - 1),
                              },
                            }));
                            setActiveItemIndex(activeItemIndex - 1);
                          }}
                          disabled={activeItemIndex === 0}
                          className="rounded-lg border border-neutral-200 px-2 py-1 text-xs disabled:opacity-40 dark:border-neutral-800"
                        >
                          Monter
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setForm((prev) => ({
                              ...prev,
                              highlight: {
                                ...prev.highlight,
                                items: moveItem(prev.highlight.items, activeItemIndex, activeItemIndex + 1),
                              },
                            }));
                            setActiveItemIndex(activeItemIndex + 1);
                          }}
                          disabled={activeItemIndex === form.highlight.items.length - 1}
                          className="rounded-lg border border-neutral-200 px-2 py-1 text-xs disabled:opacity-40 dark:border-neutral-800"
                        >
                          Descendre
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </>
            ) : (
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Aucun encadre pour le moment.
              </p>
            )}
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
