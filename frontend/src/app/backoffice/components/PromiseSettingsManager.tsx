"use client";

import { FormEvent, useEffect, useState, useSyncExternalStore } from "react";
import {
  getPromiseSettings,
  getPromiseSettingsServer,
  subscribePromiseSettings,
  type PromiseCard,
  type PromiseSettings,
} from "../../content/promiseSettings";
import { savePromiseSettings } from "../../content/siteSettingsStore";
import { moveItem } from "./HomeSettingsManager";

function normalizeForSubmit(settings: PromiseSettings): PromiseSettings {
  const cards = settings.cards
    .map((card) => ({
      ...card,
      title: card.title.trim(),
      content: card.content.trim(),
    }))
    .filter((card) => card.title || card.content)
    .slice(0, 6);

  return {
    title: settings.title.trim(),
    subtitle: settings.subtitle.trim(),
    cards,
  };
}

export default function PromiseSettingsManager() {
  const [activeTab, setActiveTab] = useState<"titles" | "cards">("titles");
  const persisted = useSyncExternalStore(
    subscribePromiseSettings,
    getPromiseSettings,
    getPromiseSettingsServer,
  );
  const [form, setForm] = useState<PromiseSettings>(persisted);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setForm(persisted);
  }, [persisted]);

  function updateCard(index: number, next: Partial<PromiseCard>) {
    setForm((prev) => {
      const cards = prev.cards.slice();
      cards[index] = { ...cards[index], ...next };
      return { ...prev, cards };
    });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const normalized = normalizeForSubmit(form);
    if (!normalized.title || !normalized.subtitle) {
      setError("Le titre et le sous-titre sont obligatoires.");
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
      await savePromiseSettings(normalized, token);
      setMessage("Positionnement mis a jour.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'enregistrer le positionnement.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mt-6">
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">Positionnement</h3>
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          Editez les titres et les encarts de la section positionnement.
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
              </div>
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-lg bg-neutral-900 px-4 py-2 text-xs font-semibold text-white"
              >
                {isSaving ? "Enregistrement..." : "Enregistrer"}
              </button>
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

            {activeTab === "cards" ? (
              <div className="grid gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      cards: [
                        ...prev.cards,
                        {
                          id: `promise-card-${Date.now()}`,
                          title: "Nouvel encart",
                          content: "",
                        },
                      ],
                    }))
                  }
                  disabled={form.cards.length >= 6}
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
                        <span className="text-xs font-semibold">Contenu</span>
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
