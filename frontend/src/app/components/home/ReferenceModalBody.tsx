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
        <div className="panel-muted p-5 backdrop-blur-sm">
          <p className="text-sm font-semibold">Situation</p>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed [color:var(--text-secondary)]">
            {situation}
          </p>
        </div>

        <div className="panel-muted p-5 backdrop-blur-sm">
          <p className="text-sm font-semibold">Tâches</p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm [color:var(--text-secondary)]">
            {tasks.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>

        <div className="panel-muted p-5 backdrop-blur-sm">
          <p className="text-sm font-semibold">Actions</p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm [color:var(--text-secondary)]">
            {actions.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>

        <div className="panel-muted p-5 backdrop-blur-sm">
          <p className="text-sm font-semibold">Résultats</p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm [color:var(--text-secondary)]">
            {results.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
