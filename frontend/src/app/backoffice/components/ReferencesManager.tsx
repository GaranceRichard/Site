"use client";

import { useReferencesManager } from "./references/useReferencesManager";

type ReferencesManagerProps = {
  apiBase: string | undefined;
  onRequestLogin: () => void;
};

export default function ReferencesManager({ apiBase, onRequestLogin }: ReferencesManagerProps) {
  const {
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
  } = useReferencesManager({ apiBase, onRequestLogin });

  return (
    <div className="mt-6">
      <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
              Références ({items.length})
            </h3>
            {status === "loading" ? <span className="text-xs text-neutral-500">Chargement…</span> : null}
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

        {status === "error" ? <p className="mt-3 text-sm text-red-600">Erreur : {errorMsg}</p> : null}

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
                        {isUploadingImage ? <span className="text-xs text-neutral-500">Upload…</span> : null}
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
                      {!form.icon ? <p className="mt-1 truncate text-xs text-neutral-400">Aucune icône</p> : null}
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
                        {isUploadingIcon ? <span className="text-xs text-neutral-500">Upload…</span> : null}
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
