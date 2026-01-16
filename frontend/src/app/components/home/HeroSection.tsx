// frontend/src/app/components/home/HeroSection.tsx
import { Container, InlinePill } from "./ui";

export default function HeroSection() {
  return (
    <section id="home" className="relative overflow-hidden">
      <div className="absolute inset-0 bg-neutral-50 dark:bg-neutral-950" />
      <div className="absolute inset-x-0 top-0 h-px bg-neutral-200 dark:bg-neutral-800" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-neutral-200 dark:bg-neutral-800" />

      <Container>
        <div className="relative grid gap-10 py-16 sm:py-20 md:grid-cols-12 md:items-start">
          <div className="md:col-span-7">
            <p className="text-sm font-medium tracking-wide text-neutral-600 dark:text-neutral-300">
              Lean-Agile — transformation pragmatique, ancrée dans le réel
            </p>

            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-6xl">
              Des équipes plus sereines.
              <span className="block text-neutral-500 dark:text-neutral-300">
                Des livraisons plus fiables.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-neutral-600 dark:text-neutral-300">
              Accompagnement orienté résultats : clarifier la priorité, stabiliser le flux, renforcer
              l’autonomie — sans surcouche inutile.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#services"
                className="rounded-xl border border-neutral-200 bg-neutral-900 px-5 py-3 text-sm font-semibold text-white shadow-[0_1px_0_rgba(0,0,0,0.04)] hover:bg-neutral-800 dark:border-neutral-800"
              >
                Voir les offres
              </a>
              <a
                href="#cases"
                className="rounded-xl border border-neutral-200 bg-white px-5 py-3 text-sm font-semibold shadow-[0_1px_0_rgba(0,0,0,0.04)] hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800"
              >
                Exemples d’impact
              </a>
            </div>

            <div className="mt-10 flex flex-wrap gap-2">
              <InlinePill>Clarté</InlinePill>
              <InlinePill>Flux</InlinePill>
              <InlinePill>Ancrage</InlinePill>
            </div>
          </div>

          {/* Bloc éditorial */}
          <div className="md:col-span-5">
            <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-[0_1px_0_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-sm font-semibold">Cadre d’intervention</p>
              <p className="mt-3 text-sm leading-7 text-neutral-600 dark:text-neutral-300">
                Diagnostic court → 2–3 leviers → routines utiles → stabilisation → transfert.
              </p>
              <div className="mt-6 h-px w-full bg-neutral-200 dark:bg-neutral-800" />
              <p className="mt-4 text-xs text-neutral-500 dark:text-neutral-400">
                Concret • Mesurable • Durable
              </p>
            </div>

            <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-[0_1px_0_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-sm font-semibold">Ce que vous obtenez</p>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-neutral-600 dark:text-neutral-300">
                <li>Une priorité explicite</li>
                <li>Un flux plus stable</li>
                <li>Une cadence soutenable</li>
              </ul>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
