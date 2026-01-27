"use client";

type UndoToastProps = {
  undoCount: number;
  onUndo: () => void;
};

export default function UndoToast({ undoCount, onUndo }: UndoToastProps) {
  if (undoCount <= 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[150] rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center gap-3">
        <span>{undoCount} message(s) supprimé(s).</span>
        <button
          type="button"
          onClick={onUndo}
          className="rounded-lg border border-neutral-200 px-3 py-1 text-xs font-semibold hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}

