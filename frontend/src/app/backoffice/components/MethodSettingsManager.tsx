"use client";

import { FormEvent, useEffect, useState, useSyncExternalStore } from "react";
import {
  getMethodSettings,
  getMethodSettingsServer,
  subscribeMethodSettings,
  type MethodSettings,
  type MethodStep,
} from "../../content/methodSettings";
import { normalizeMethodSettingsForSubmit } from "../../content/methodSubmit";
import { saveMethodSettings } from "../../content/siteSettingsStore";
import { moveItem } from "./HomeSettingsManager";

export default function MethodSettingsManager() {
  const [activeTab, setActiveTab] = useState<"titles" | "steps">("titles");
  const persisted = useSyncExternalStore(
    subscribeMethodSettings,
    getMethodSettings,
    getMethodSettingsServer,
  );
  const [form, setForm] = useState<MethodSettings>(persisted);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setForm(persisted);
  }, [persisted]);

  function updateStep(index: number, next: Partial<MethodStep>) {
    setForm((prev) => {
      const steps = prev.steps.slice();
      steps[index] = { ...steps[index], ...next };
      return { ...prev, steps };
    });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const normalized = normalizeMethodSettingsForSubmit(form);
    if (!normalized.eyebrow || !normalized.title || !normalized.subtitle) {
      setError("Le surtitre, le titre et le sous-titre sont obligatoires.");
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
      await saveMethodSettings(normalized, token);
      setMessage("Approche mise a jour.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'enregistrer l'approche.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mt-6">
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">Approche</h3>
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          Editez le surtitre, les textes et les etapes de la section approche.
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
                  onClick={() => setActiveTab("steps")}
                  className={[
                    "rounded-t-lg border border-b-0 px-3 py-2 text-xs font-semibold",
                    activeTab === "steps"
                      ? "border-neutral-300 bg-white text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50"
                      : "border-neutral-200 bg-white text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200",
                  ].join(" ")}
                >
                  Etapes
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
                  <span className="text-sm font-semibold">Surtitre</span>
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

            {activeTab === "steps" ? (
              <div className="grid gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      steps: [
                        ...prev.steps,
                        {
                          id: `method-step-${Date.now()}`,
                          step: String(prev.steps.length + 1).padStart(2, "0"),
                          title: "Nouvelle etape",
                          text: "",
                        },
                      ],
                    }))
                  }
                  disabled={form.steps.length >= 6}
                  className="w-fit rounded-lg border border-neutral-200 px-3 py-1 text-xs font-semibold disabled:opacity-50 dark:border-neutral-800"
                >
                  Ajouter
                </button>
                <div className="grid gap-3 md:grid-cols-2">
                  {form.steps.map((step, index) => (
                    <div
                      key={step.id}
                      className="grid gap-2 rounded-lg border border-neutral-200 p-3 dark:border-neutral-800"
                    >
                      <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                        Etape {index + 1}
                      </p>
                      <label className="grid gap-1">
                        <span className="text-xs font-semibold">Numero</span>
                        <input
                          type="text"
                          value={step.step}
                          onChange={(e) => updateStep(index, { step: e.currentTarget.value })}
                          className="rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950"
                        />
                      </label>
                      <label className="grid gap-1">
                        <span className="text-xs font-semibold">Titre etape</span>
                        <input
                          type="text"
                          value={step.title}
                          onChange={(e) => updateStep(index, { title: e.currentTarget.value })}
                          className="rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950"
                        />
                      </label>
                      <label className="grid gap-1">
                        <span className="text-xs font-semibold">Texte</span>
                        <textarea
                          rows={5}
                          value={step.text}
                          onChange={(e) => updateStep(index, { text: e.currentTarget.value })}
                          className="rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950"
                        />
                      </label>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({ ...prev, steps: moveItem(prev.steps, index, index - 1) }))
                          }
                          disabled={index === 0}
                          className="rounded-lg border border-neutral-200 px-2 py-1 text-xs disabled:opacity-40 dark:border-neutral-800"
                        >
                          Monter
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({ ...prev, steps: moveItem(prev.steps, index, index + 1) }))
                          }
                          disabled={index === form.steps.length - 1}
                          className="rounded-lg border border-neutral-200 px-2 py-1 text-xs disabled:opacity-40 dark:border-neutral-800"
                        >
                          Descendre
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              steps: prev.steps.filter((_, i) => i !== index),
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
