"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import type { FormEvent } from "react";

type UseSettingsManagerOptions<TPersisted, TForm, TNormalized, TTab extends string> = {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => TPersisted;
  getServerSnapshot: () => TPersisted;
  initialTab: TTab;
  normalizeForSubmit: (form: TForm) => TNormalized;
  save: (normalized: TNormalized, token: string) => Promise<unknown>;
  successMessage: string;
  fallbackErrorMessage: string;
  mapPersistedToForm?: (persisted: TPersisted) => TForm;
  validate?: (normalized: TNormalized) => string | null;
};

function getAccessToken() {
  try {
    return sessionStorage.getItem("access_token");
  } catch {
    return null;
  }
}

export function useSettingsManager<
  TPersisted,
  TForm = TPersisted,
  TNormalized = TForm,
  TTab extends string = string,
>({
  subscribe,
  getSnapshot,
  getServerSnapshot,
  initialTab,
  normalizeForSubmit,
  save,
  successMessage,
  fallbackErrorMessage,
  mapPersistedToForm,
  validate,
}: UseSettingsManagerOptions<TPersisted, TForm, TNormalized, TTab>) {
  const persisted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [activeTab, setActiveTab] = useState<TTab>(initialTab);
  const [form, setForm] = useState<TForm>(() =>
    mapPersistedToForm ? mapPersistedToForm(persisted) : (persisted as unknown as TForm),
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setForm(mapPersistedToForm ? mapPersistedToForm(persisted) : (persisted as unknown as TForm));
    // We intentionally sync on store updates only. Components may pass inline mappers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persisted]);

  const onSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setMessage(null);
      setError(null);

      const normalized = normalizeForSubmit(form);
      const validationError = validate?.(normalized) ?? null;
      if (validationError) {
        setError(validationError);
        return;
      }

      const token = getAccessToken();
      if (!token) {
        setError("Connexion requise pour enregistrer ces changements.");
        return;
      }

      setIsSaving(true);
      try {
        await save(normalized, token);
        setMessage(successMessage);
      } catch (err) {
        setError(err instanceof Error ? err.message : fallbackErrorMessage);
      } finally {
        setIsSaving(false);
      }
    },
    [fallbackErrorMessage, form, normalizeForSubmit, save, successMessage, validate],
  );

  return {
    activeTab,
    error,
    form,
    isSaving,
    message,
    persisted,
    setActiveTab,
    setError,
    setForm,
    setMessage,
    onSubmit,
  };
}
