import { isDemoMode } from "../lib/demo";

export default function DemoNotice() {
  if (!isDemoMode()) {
    return null;
  }

  return (
    <section aria-label="Version de demonstration" className="border-b subtle-divider bg-[color:var(--surface-muted)]/80">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-3 text-sm sm:px-8">
        <p className="[color:var(--text-secondary)]">
          Version de demonstration statique du frontoffice publiee sur GitHub Pages.
        </p>
        <span className="ui-pill px-3 py-1 text-xs font-semibold">Demo statique</span>
      </div>
    </section>
  );
}
