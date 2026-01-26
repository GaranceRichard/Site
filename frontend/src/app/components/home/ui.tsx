// frontend/src/app/components/home/ui.tsx
import type { ReactNode } from "react";

export function Container({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">{children}</div>;
}

export function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="text-sm font-medium tracking-wide text-neutral-500 dark:text-neutral-400">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
      {description ?(
        <p className="mt-3 text-base leading-relaxed text-neutral-600 dark:text-neutral-300">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function InlinePill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">
      {children}
    </span>
  );
}

export function DetailsAccordion({ title, points }: { title: string; points: string[] }) {
  return (
    <details className="group rounded-2xl border border-neutral-200 bg-white p-6 shadow-[0_1px_0_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
        <span className="text-sm font-semibold">{title}</span>
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white text-sm text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200">
          <span className="group-open:hidden">+</span>
          <span className="hidden group-open:inline">–</span>
        </span>
      </summary>

      <div className="mt-4 space-y-2">
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
          {points.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </div>
    </details>
  );
}

export function CaseCard({
  title,
  tag,
  description,
}: {
  title: string;
  tag: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-[0_1px_0_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">{title}</p>
        <span className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs text-neutral-600 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300">
          {tag}
        </span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">{description}</p>
    </div>
  );
}
