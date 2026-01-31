"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import type { Reference } from "../types";

type ReferencesManagerProps = {
  apiBase: string | undefined;
  onRequestLogin: () => void;
};

type FormState = {
  reference: string;
  referenceShort: string;
  image: string;
  imageThumb: string;
  icon: string;
  situation: string;
  tasks: string;
  actions: string;
  results: string;
};

const emptyForm: FormState = {
  reference: "",
  referenceShort: "",
  image: "",
  imageThumb: "",
  icon: "",
  situation: "",
  tasks: "",
  actions: "",
  results: "",
};

function listToText(items: string[] | undefined): string {
  return (items ?? []).join("\n");
}

function textToList(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function ReferencesManager({ apiBase, onRequestLogin }: ReferencesManagerProps) {
  const [items, setItems] = useState<Reference[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalError, setModalError] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const iconInputRef = useRef<HTMLInputElement | null>(null);
  const didInitRef = useRef(false);

  const isEditing = useMemo(() => editingId !== null, [editingId]);
  const hasSelection = selectedIds.size > 0;

  const resetForm = useCallback(() => {
    setEditingId(null);
    setForm(emptyForm);
    setModalError("");
  }, []);

  const getToken = useCallback(() => {
    try {
      return sessionStorage.getItem("access_token");
    } catch {
      return null;
    }
  }, []);

  const reportError = useCallback(
    (message: string) => {
      if (modalOpen) {
        setModalError(message);
        setStatus("idle");
        return;
      }
      setStatus("error");
      setErrorMsg(message);
    },
    [modalOpen],
  );

  const requireAuth = useCallback(() => {
    reportError("Connexion requise pour accéder aux références.");
    onRequestLogin();
  }, [onRequestLogin, reportError]);

  const load = useCallback(async () => {
    setErrorMsg("");
    if (!apiBase) {
      setStatus("error");
      setErrorMsg("Configuration manquante : NEXT_PUBLIC_API_BASE_URL.");
      return;
    }

    const token = getToken();
    if (!token) {
      requireAuth();
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch(`${apiBase}/api/contact/references/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401 || res.status === 403) {
        requireAuth();
        return;
      }

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Erreur API (${res.status})`);
      }

      const data = (await res.json()) as Reference[];
      setItems(data.slice().sort((a, b) => a.order_index - b.order_index));
      setStatus("idle");
    } catch (e: unknown) {
      setStatus("error");
      setErrorMsg(e instanceof Error ? e.message : "Erreur inattendue");
    }
  }, [apiBase, getToken, requireAuth]);

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    void load();
  }, [load]);

  const openCreateModal = useCallback(() => {
    resetForm();
    setModalOpen(true);
  }, [resetForm]);

  const openEditModal = useCallback((item: Reference) => {
    setModalError("");
    setEditingId(item.id);
    setForm({
      reference: item.reference,
      referenceShort: item.reference_short || "",
      image: item.image || "",
      imageThumb: item.image_thumb || "",
      icon: item.icon || "",
      situation: item.situation || "",
      tasks: listToText(item.tasks),
      actions: listToText(item.actions),
      results: listToText(item.results),
    });
    setModalOpen(true);
  }, []);

  const toggleSelected = useCallback((id: number, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const toggleAll = useCallback((checked: boolean) => {
    if (!checked) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(items.map((item) => item.id)));
  }, [items]);

  const onRowClick = useCallback(
    (item: Reference) => {
      openEditModal(item);
    },
    [openEditModal],
  );

  const moveItem = useCallback(
    async (fromIndex: number, direction: "up" | "down") => {
      if (!apiBase) {
        setStatus("error");
        setErrorMsg("Configuration manquante : NEXT_PUBLIC_API_BASE_URL.");
        return;
      }

      const token = getToken();
      if (!token) {
        requireAuth();
        return;
      }

      const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
      if (toIndex < 0 || toIndex >= items.length) return;

      const current = items[fromIndex];
      const other = items[toIndex];
      if (!current || !other) return;

      const currentOrder = current.order_index;
      const otherOrder = other.order_index;

      const next = [...items];
      next[fromIndex] = { ...other, order_index: currentOrder };
      next[toIndex] = { ...current, order_index: otherOrder };
      setItems(next);

      setStatus("loading");
      setErrorMsg("");
      try {
        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };
        const resA = await fetch(`${apiBase}/api/contact/references/admin/${current.id}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({ order_index: otherOrder }),
        });
        if (resA.status === 401 || resA.status === 403) {
          requireAuth();
          return;
        }
        if (!resA.ok) {
          const txt = await resA.text();
          throw new Error(txt || `Erreur API (${resA.status})`);
        }

        const resB = await fetch(`${apiBase}/api/contact/references/admin/${other.id}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({ order_index: currentOrder }),
        });
        if (resB.status === 401 || resB.status === 403) {
          requireAuth();
          return;
        }
        if (!resB.ok) {
          const txt = await resB.text();
          throw new Error(txt || `Erreur API (${resB.status})`);
        }

        setStatus("idle");
      } catch (e: unknown) {
        setStatus("error");
        setErrorMsg(e instanceof Error ? e.message : "Erreur inattendue");
        void load();
      }
    },
    [apiBase, getToken, items, load, requireAuth],
  );

  const onDeleteSelected = useCallback(async () => {
    if (!apiBase || selectedIds.size === 0) return;

    const token = getToken();
    if (!token) {
      requireAuth();
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    const ids = Array.from(selectedIds.values());
    try {
      for (const id of ids) {
        const res = await fetch(`${apiBase}/api/contact/references/admin/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401 || res.status === 403) {
          requireAuth();
          return;
        }

        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || `Erreur API (${res.status})`);
        }
      }

      setItems((prev) => prev.filter((r) => !selectedIds.has(r.id)));
      if (editingId && selectedIds.has(editingId)) {
        setModalOpen(false);
        resetForm();
      }
      setSelectedIds(new Set());
      setStatus("idle");
    } catch (e: unknown) {
      setStatus("error");
      setErrorMsg(e instanceof Error ? e.message : "Erreur inattendue");
    }
  }, [apiBase, editingId, getToken, requireAuth, resetForm, selectedIds]);

  const onSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setErrorMsg("");
      setModalError("");

      if (!apiBase) {
        setStatus("error");
        setErrorMsg("Configuration manquante : NEXT_PUBLIC_API_BASE_URL.");
        return;
      }

      const token = getToken();
      if (!token) {
        requireAuth();
        return;
      }

      const payload = {
        reference: form.reference.trim(),
        reference_short: form.referenceShort.trim(),
        image: form.image.trim(),
        image_thumb: form.imageThumb.trim() || undefined,
        icon: form.icon.trim(),
        situation: form.situation.trim(),
        tasks: textToList(form.tasks),
        actions: textToList(form.actions),
        results: textToList(form.results),
      };

      if (!payload.reference || !payload.image) {
        reportError("Référence et image sont obligatoires.");
        return;
      }

      setStatus("loading");
      try {
        const res = await fetch(
          editingId
            ? `${apiBase}/api/contact/references/admin/${editingId}`
            : `${apiBase}/api/contact/references/admin`,
          {
            method: editingId ? "PUT" : "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          },
        );

        if (res.status === 401 || res.status === 403) {
          requireAuth();
          return;
        }

        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || `Erreur API (${res.status})`);
        }

        const saved = (await res.json()) as Reference;
        setItems((prev) => {
          if (editingId) {
            return prev
              .map((r) => (r.id === saved.id ? saved : r))
              .slice()
              .sort((a, b) => a.order_index - b.order_index);
          }
          return [...prev, saved].slice().sort((a, b) => a.order_index - b.order_index);
        });
        setSelectedIds((prev) => new Set(prev).add(saved.id));
        setStatus("idle");
        setModalOpen(false);
        resetForm();
      } catch (e: unknown) {
        reportError(e instanceof Error ? e.message : "Erreur inattendue");
      }
    },
    [apiBase, editingId, form, getToken, reportError, requireAuth, resetForm],
  );

  const uploadFile = useCallback(
    async (file: File, target: "image" | "icon") => {
      if (!apiBase) {
        setStatus("error");
        setErrorMsg("Configuration manquante : NEXT_PUBLIC_API_BASE_URL.");
        return;
      }

      const token = getToken();
      if (!token) {
        requireAuth();
        return;
      }

      if (target === "image") {
        setIsUploadingImage(true);
      } else {
        setIsUploadingIcon(true);
      }

      setErrorMsg("");
      setModalError("");
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(`${apiBase}/api/contact/references/admin/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (res.status === 401 || res.status === 403) {
          requireAuth();
          return;
        }

        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || `Erreur API (${res.status})`);
        }

        const data = (await res.json()) as { url?: string; thumbnail_url?: string };
        if (data.url) {
          if (target === "image") {
            setForm((prev) => ({
              ...prev,
              image: data.url ?? "",
              imageThumb: data.thumbnail_url ?? "",
            }));
          } else {
            setForm((prev) => ({ ...prev, icon: data.url ?? "" }));
          }
        } else {
          throw new Error("URL d'image manquante.");
        }
      } catch (e: unknown) {
        reportError(e instanceof Error ? e.message : "Erreur inattendue");
      } finally {
        if (target === "image") {
          setIsUploadingImage(false);
        } else {
          setIsUploadingIcon(false);
        }
      }
    },
    [apiBase, getToken, reportError, requireAuth],
  );

  const onImageChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      void uploadFile(file, "image");
      event.target.value = "";
    },
    [uploadFile],
  );

  const onIconChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      void uploadFile(file, "icon");
      event.target.value = "";
    },
    [uploadFile],
  );

  return (
    <div className="mt-6">
      <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
              Références ({items.length})
            </h3>
            {status === "loading" ? (
              <span className="text-xs text-neutral-500">Chargement…</span>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openCreateModal}
              className="rounded-lg border border-neutral-200 px-3 py-1 text-xs font-semibold hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800"
            >
              Ajouter
            </button>
            <button
              type="button"
              onClick={onDeleteSelected}
              disabled={!hasSelection}
              className={[
                "rounded-lg border px-3 py-1 text-xs font-semibold",
                hasSelection
                  ? "border-red-200 text-red-600 hover:bg-red-50 dark:border-red-400/40 dark:text-red-300 dark:hover:bg-red-950/30"
                  : "border-neutral-200 text-neutral-400 opacity-60 dark:border-neutral-800",
              ].join(" ")}
            >
              Supprimer
            </button>
          </div>
        </div>

        {status === "error" ? (
          <p className="mt-3 text-sm text-red-600">Erreur : {errorMsg}</p>
        ) : null}

        <div className="mt-4 overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500 dark:bg-neutral-900/70 dark:text-neutral-400">
              <tr>
                <th className="w-10 px-4 py-2">
                  {items.length > 0 ? (
                    <input
                      type="checkbox"
                      aria-label="Tout sélectionner"
                      checked={selectedIds.size === items.length}
                      onChange={(e) => toggleAll(e.currentTarget.checked)}
                      className="h-4 w-4 rounded border-neutral-300"
                    />
                  ) : null}
                </th>
                <th className="w-24 px-4 py-2">Ordre</th>
                <th className="px-4 py-2">Référence</th>
                <th className="w-20 px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {items.map((item, index) => (
                <tr
                  key={item.id}
                  className={[
                    "cursor-pointer",
                    selectedIds.has(item.id)
                      ? "bg-neutral-100 dark:bg-neutral-800/70"
                      : "hover:bg-neutral-50 dark:hover:bg-neutral-800/40",
                  ].join(" ")}
                  onClick={() => onRowClick(item)}
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      aria-label={`Sélectionner ${item.reference}`}
                      checked={selectedIds.has(item.id)}
                      onChange={(e) => toggleSelected(item.id, e.currentTarget.checked)}
                      className="h-4 w-4 rounded border-neutral-300"
                    />
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <span className="w-6 text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                      {item.order_index}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-neutral-900 dark:text-neutral-50">
                    {item.reference}
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        aria-label={`Monter ${item.reference}`}
                        disabled={index === 0}
                        onClick={() => moveItem(index, "up")}
                        className={[
                          "rounded border border-neutral-200 px-1.5 py-0.5 text-xs font-semibold",
                          index === 0
                            ? "cursor-not-allowed text-neutral-300"
                            : "text-neutral-700 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-800",
                          "dark:border-neutral-800",
                        ].join(" ")}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        aria-label={`Descendre ${item.reference}`}
                        disabled={index === items.length - 1}
                        onClick={() => moveItem(index, "down")}
                        className={[
                          "rounded border border-neutral-200 px-1.5 py-0.5 text-xs font-semibold",
                          index === items.length - 1
                            ? "cursor-not-allowed text-neutral-300"
                            : "text-neutral-700 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-800",
                          "dark:border-neutral-800",
                        ].join(" ")}
                      >
                        ↓
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && status !== "loading" ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-neutral-500">
                    Aucune référence.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Fermer"
            onClick={() => {
              if (isEditing) {
                setModalOpen(false);
              }
            }}
            disabled={!isEditing}
            className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
          />
          <div className="relative z-10 w-full max-w-5xl overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-950">
            <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
              <div>
                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                  {isEditing ? "Modifier la référence" : "Créer une référence"}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Modifiez librement puis enregistrez.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-neutral-200 px-3 py-1 text-xs font-semibold hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800"
              >
                Fermer
              </button>
            </div>

            <form onSubmit={onSubmit} className="grid max-h-[75vh] gap-4 p-5 text-sm">
              <div className="grid gap-4 overflow-auto pr-1 md:grid-cols-[1.05fr_1fr]">
                <div className="grid gap-4">
                  {modalError ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-200">
                      {modalError}
                    </div>
                  ) : null}

                  <label className="block">
                    <span className="font-semibold">Référence</span>
                    <input
                      value={form.reference}
                      onChange={(e) => setForm((prev) => ({ ...prev, reference: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950"
                    />
                  </label>

                  <label className="block">
                    <span className="font-semibold">Titre court</span>
                    <input
                      value={form.referenceShort}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, referenceShort: e.target.value }))
                      }
                      className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950"
                    />
                  </label>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
                      <p className="text-xs font-semibold text-neutral-500">Image</p>
                      {!form.image ? (
                        <p className="mt-1 truncate text-xs text-neutral-400">Aucune image</p>
                      ) : null}
                      <div className="mt-3 flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => imageInputRef.current?.click()}
                          className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-semibold hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800"
                        >
                          Charger l’image
                        </button>
                        {isUploadingImage ? (
                          <span className="text-xs text-neutral-500">Upload…</span>
                        ) : null}
                      </div>
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={onImageChange}
                        className="hidden"
                      />
                    </div>

                    <div className="relative rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
                      <p className="text-xs font-semibold text-neutral-500">Icône</p>
                      {!form.icon ? (
                        <p className="mt-1 truncate text-xs text-neutral-400">Aucune icône</p>
                      ) : null}
                      {form.icon ? (
                        <button
                          type="button"
                          aria-label="Supprimer l’icône"
                          onClick={() => setForm((prev) => ({ ...prev, icon: "" }))}
                          className="absolute right-2 top-2 h-6 w-6 rounded-full border border-neutral-200 text-[11px] font-semibold text-neutral-500 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800"
                        >
                          ×
                        </button>
                      ) : null}
                      <div className="mt-3 flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => iconInputRef.current?.click()}
                          className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-semibold hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800"
                        >
                          Charger l’icône
                        </button>
                        {isUploadingIcon ? (
                          <span className="text-xs text-neutral-500">Upload…</span>
                        ) : null}
                      </div>
                      <input
                        ref={iconInputRef}
                        type="file"
                        accept="image/*"
                        onChange={onIconChange}
                        className="hidden"
                      />
                    </div>
                  </div>

                  <label className="block">
                    <span className="font-semibold">Situation</span>
                    <textarea
                      value={form.situation}
                      onChange={(e) => setForm((prev) => ({ ...prev, situation: e.target.value }))}
                      className="mt-1 min-h-[110px] w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950"
                    />
                  </label>
                </div>

                <div className="grid gap-4">
                  <label className="block">
                    <span className="font-semibold">Tâches (1 par ligne)</span>
                    <textarea
                      value={form.tasks}
                      onChange={(e) => setForm((prev) => ({ ...prev, tasks: e.target.value }))}
                      className="mt-1 min-h-[120px] w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950"
                    />
                  </label>

                  <label className="block">
                    <span className="font-semibold">Actions (1 par ligne)</span>
                    <textarea
                      value={form.actions}
                      onChange={(e) => setForm((prev) => ({ ...prev, actions: e.target.value }))}
                      className="mt-1 min-h-[120px] w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950"
                    />
                  </label>

                  <label className="block">
                    <span className="font-semibold">Résultats (1 par ligne)</span>
                    <textarea
                      value={form.results}
                      onChange={(e) => setForm((prev) => ({ ...prev, results: e.target.value }))}
                      className="mt-1 min-h-[120px] w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-950"
                    />
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="submit"
                  className="rounded-lg bg-neutral-900 px-4 py-2 text-xs font-semibold text-white"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
