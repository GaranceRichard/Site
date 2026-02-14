"use client";

import { FormEvent, useEffect, useState, useSyncExternalStore } from "react";
import {
  DEFAULT_HEADER_SETTINGS,
  getHeaderSettings,
  getHeaderSettingsServer,
  setHeaderSettings,
  subscribeHeaderSettings,
  type HeaderSettings,
} from "../../content/headerSettings";

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export default function HeaderSettingsManager() {
  const persisted = useSyncExternalStore(
    subscribeHeaderSettings,
    getHeaderSettings,
    getHeaderSettingsServer,
  );
  const [form, setForm] = useState<HeaderSettings>(persisted);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm(persisted);
  }, [persisted]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const name = form.name.trim();
    const title = form.title.trim();
    const bookingUrl = form.bookingUrl.trim();

    if (!name || !title || !bookingUrl) {
      setError("Tous les champs sont obligatoires.");
      return;
    }

    if (!isHttpUrl(bookingUrl)) {
      setError("L'adresse de prise de rendez-vous doit etre une URL http(s) valide.");
      return;
    }

    setHeaderSettings({ name, title, bookingUrl });
    setMessage("Header mis a jour.");
  }

  function onResetDefaults() {
    setHeaderSettings(DEFAULT_HEADER_SETTINGS);
    setMessage("Valeurs par defaut restaurees.");
    setError(null);
  }

  return (
    <div className="mt-6">
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">Header du site</h3>
        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
          Modifiez le nom, le titre et l URL du bouton &quot;Prendre rendez-vous&quot;.
        </p>

        <form onSubmit={onSubmit} className="mt-5 grid gap-4">
          <label className="block">
            <span className="text-sm font-semibold">Nom</span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => {
                const value = e.currentTarget.value;
                setForm((prev) => ({ ...prev, name: value }));
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
            <span className="text-sm font-semibold">Adresse de prise de rendez-vous</span>
            <input
              type="url"
              value={form.bookingUrl}
              onChange={(e) => {
                const value = e.currentTarget.value;
                setForm((prev) => ({ ...prev, bookingUrl: value }));
              }}
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950"
            />
          </label>

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

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              className="rounded-lg bg-neutral-900 px-4 py-2 text-xs font-semibold text-white"
            >
              Enregistrer
            </button>
            <button
              type="button"
              onClick={onResetDefaults}
              className="rounded-lg border border-neutral-200 px-4 py-2 text-xs font-semibold hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800"
            >
              Reinitialiser
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
