"use client";

type ReferenceModalBodyProps = {
  situation: string;
  tasks: string[];
  actions: string[];
  results: string[];
};

export default function ReferenceModalBody({
  situation,
  tasks,
  actions,
  results,
}: ReferenceModalBodyProps) {
  return (
    <div className="relative z-10 max-h-[60vh] overflow-auto p-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-neutral-200/70 bg-white/60 p-5 backdrop-blur-sm dark:border-neutral-800/70 dark:bg-neutral-950/35">
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">Situation</p>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-neutral-700 dark:text-neutral-200">
            {situation}
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200/70 bg-white/60 p-5 backdrop-blur-sm dark:border-neutral-800/70 dark:bg-neutral-950/35">
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">Tâches</p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-neutral-700 dark:text-neutral-200">
            {tasks.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-neutral-200/70 bg-white/60 p-5 backdrop-blur-sm dark:border-neutral-800/70 dark:bg-neutral-950/35">
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">Actions</p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-neutral-700 dark:text-neutral-200">
            {actions.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-neutral-200/70 bg-white/60 p-5 backdrop-blur-sm dark:border-neutral-800/70 dark:bg-neutral-950/35">
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">Résultats</p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-neutral-700 dark:text-neutral-200">
            {results.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
