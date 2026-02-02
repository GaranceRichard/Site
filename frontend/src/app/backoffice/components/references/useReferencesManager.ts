import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

import type { Reference } from "../../types";

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

type UseReferencesManagerParams = {
  apiBase: string | undefined;
  onRequestLogin: () => void;
};

export function useReferencesManager({
  apiBase,
  onRequestLogin,
}: UseReferencesManagerParams) {
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

  const toggleAll = useCallback(
    (checked: boolean) => {
      if (!checked) {
        setSelectedIds(new Set());
        return;
      }
      setSelectedIds(new Set(items.map((item) => item.id)));
    },
    [items],
  );

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

  return {
    items,
    status,
    errorMsg,
    selectedIds,
    form,
    modalOpen,
    modalError,
    isUploadingImage,
    isUploadingIcon,
    imageInputRef,
    iconInputRef,
    isEditing,
    hasSelection,
    openCreateModal,
    toggleSelected,
    toggleAll,
    onRowClick,
    moveItem,
    onDeleteSelected,
    onSubmit,
    onImageChange,
    onIconChange,
    setModalOpen,
    setForm,
  };
}
