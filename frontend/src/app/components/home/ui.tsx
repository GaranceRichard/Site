// frontend/src/app/components/home/ui.tsx
import type { AnchorHTMLAttributes, ReactNode } from "react";

export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export const PANEL_CLASS = "panel p-6";
export const MUTED_PANEL_CLASS = "panel-muted p-6";
export const ELEVATED_PANEL_CLASS = "panel-elevated p-6 md:p-7";
export const PILL_CLASS = "ui-pill inline-flex items-center px-3 py-1 text-xs font-medium";
export const PRIMARY_BUTTON_CLASS =
  "primary-button interactive-lift inline-flex items-center justify-center px-5 py-3 text-sm font-semibold";
export const SECONDARY_BUTTON_CLASS =
  "secondary-button interactive-lift inline-flex items-center justify-center px-5 py-3 text-sm font-semibold";

export function Container({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">{children}</div>;
}

export function PrimaryButton({
  children,
  className,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a {...props} className={cx(PRIMARY_BUTTON_CLASS, className)}>
      {children}
    </a>
  );
}

export function SecondaryButton({
  children,
  className,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a {...props} className={cx(SECONDARY_BUTTON_CLASS, className)}>
      {children}
    </a>
  );
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
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="section-title mt-4 text-balance text-[2.2rem] sm:text-[2.85rem]">{title}</h2>
      {description ? <p className="section-copy mt-4 max-w-2xl">{description}</p> : null}
    </div>
  );
}

export function InlinePill({ children }: { children: ReactNode }) {
  return <span className={PILL_CLASS}>{children}</span>;
}

export function DetailsAccordion({ title, points }: { title: string; points: string[] }) {
  return (
    <details className="group panel p-6">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
        <span className="text-sm font-semibold">{title}</span>
        <span className="ui-pill inline-flex h-8 w-8 items-center justify-center text-sm">
          <span className="group-open:hidden">+</span>
          <span className="hidden group-open:inline">-</span>
        </span>
      </summary>

      <div className="mt-4 space-y-2">
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed [color:var(--text-secondary)]">
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
    <div className={cx(PANEL_CLASS, "h-full")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">{tag}</p>
          <p className="mt-3 text-base font-semibold">{title}</p>
        </div>
        <span className={cx(PILL_CLASS, "shrink-0")}>{tag}</span>
      </div>
      <p className="mt-4 text-sm leading-relaxed [color:var(--text-secondary)]">{description}</p>
    </div>
  );
}
