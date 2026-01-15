// frontend/src/app/page.tsx
import Link from "next/link";
import ThemeToggle from "./components/ThemeToggle";
import ScrollNav from "./components/ScrollNav";
import TopNav from "./components/TopNav";
import ScrollTo from "./components/ScrollTo";


type NavItem = { label: string; href: string };

const NAV: NavItem[] = [
  { label: "Accueil", href: "#home" },
  { label: "Promesse", href: "#promise" },
  { label: "Offres", href: "#services" },
  { label: "Références", href: "#cases" },
  { label: "Méthode", href: "#method" },
  { label: "À propos", href: "#about" },
];

const BOOKING_URL = "https://calendar.app.google/hYgX38RpfWiu65Vh8";

const SERVICES = [
  {
    title: "Coaching Lean-Agile — transformation pragmatique",
    points: [
      "Cadrage : objectifs, périmètre, gouvernance légère",
      "Coaching d’équipes : rituels, flux, qualité, amélioration continue",
      "Accompagnement des leaders : posture, décision, pilotage",
    ],
  },
  {
    title: "Facilitation — ateliers décisifs et alignement",
    points: [
      "Ateliers d’alignement (vision, priorités, arbitrages)",
      "Résolution structurée de problèmes (A3, 5 Why, etc.)",
      "Conception de parcours d’ateliers (du diagnostic à l’action)",
    ],
  },
  {
    title: "Formation — bases solides, ancrage durable",
    points: [
      "Lean / Agile : fondamentaux, pratiques, anti-patterns",
      "Pilotage par la valeur : priorisation, métriques, flow",
      "Transfert : supports, exercices, plan d’ancrage",
    ],
  },
];

const CASES = [
  {
    title: "Réduction du délai de livraison",
    tag: "Flow & qualité",
    description:
      "Pilotage simple du flux (WIP, limites, revues), stabilisation de la qualité et clarification des priorités.",
  },
  {
    title: "Alignement multi-équipes",
    tag: "Gouvernance légère",
    description:
      "Ateliers d’alignement, clarification des dépendances, rituels inter-équipes et règles de décision — sans surcharger l’organisation.",
  },
  {
    title: "Montée en autonomie des équipes",
    tag: "Coaching",
    description:
      "Renforcement de la posture, amélioration continue, responsabilisation progressive sur la planification et la livraison.",
  },
];

function Container({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">{children}</div>;
}

function SectionTitle({
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
      <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 text-base leading-relaxed text-neutral-600 dark:text-neutral-300">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function DetailsAccordion({ title, points }: { title: string; points: string[] }) {
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

function CaseCard({
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
      <p className="mt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
        {description}
      </p>
    </div>
  );
}

function InlinePill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">
      {children}
    </span>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50">
      {/* Header sticky */}
      <TopNav nav={NAV} bookingUrl={BOOKING_URL} />
      {/* HERO */}
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

      {/* PROMISE */}
      <section id="promise" className="py-16 sm:py-20">
        <Container>
          <div className="grid gap-10 md:grid-cols-12 md:items-start">
            <div className="md:col-span-5">
              <SectionTitle
                eyebrow="Promesse"
                title="Un accompagnement sérieux, sobre, orienté résultats"
                description="Vous gardez l’essentiel : une approche structurée, respectueuse du contexte, qui sécurise la livraison et renforce l’autonomie."
              />
            </div>

            <div className="md:col-span-7">
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  {
                    title: "Diagnostic rapide",
                    text: "Observer le flux, clarifier les irritants, choisir peu d’actions à fort effet.",
                  },
                  {
                    title: "Cadre de pilotage",
                    text: "Quelques métriques utiles, un rythme de revue, une décision plus fluide.",
                  },
                  {
                    title: "Qualité",
                    text: "Stabiliser l’exécution : limiter le WIP, réduire les reprises, sécuriser le done.",
                  },
                  {
                    title: "Transfert",
                    text: "Rendre l’organisation autonome : pratiques, supports, routine d’amélioration.",
                  },
                ].map((c) => (
                  <div
                    key={c.title}
                    className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-[0_1px_0_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900"
                  >
                    <p className="text-sm font-semibold">{c.title}</p>
                    <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                      {c.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* SERVICES */}
      <section id="services" className="py-16 sm:py-20">
        <Container>
          <div className="grid gap-10 md:grid-cols-12">
            <div className="md:col-span-5">
              <SectionTitle
                eyebrow="Offres"
                title="Trois formats, une même exigence"
                description="Des interventions calibrées : utiles, lisibles, et soutenables dans la durée."
              />

              <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-[0_1px_0_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900">
                <p className="text-sm font-semibold">Format type</p>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-neutral-600 dark:text-neutral-300">
                  <li>Diagnostic & cadrage</li>
                  <li>Accompagnement (4 à 12 semaines)</li>
                  <li>Restitution & plan d’ancrage</li>
                </ul>
              </div>
            </div>

            <div className="md:col-span-7">
              <div className="space-y-4">
                {SERVICES.map((s) => (
                  <DetailsAccordion key={s.title} title={s.title} points={s.points} />
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* CASES */}
      <section id="cases" className="py-16 sm:py-20">
        <Container>
          <SectionTitle
            eyebrow="Références"
            title="Exemples d’impact"
            description="Sans promesses vagues : des résultats observables, soutenus par un cadre simple."
          />

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {CASES.map((c) => (
              <CaseCard key={c.title} title={c.title} tag={c.tag} description={c.description} />
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600 shadow-[0_1px_0_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
            <span className="font-semibold text-neutral-900 dark:text-neutral-50">Option :</span>{" "}
            intégrer ici des “preuves” (avant/après, métriques, verbatims), en gardant la même sobriété.
          </div>
        </Container>
      </section>

      {/* METHOD */}
      <section id="method" className="py-16 sm:py-20">
        <Container>
          <div className="grid gap-10 md:grid-cols-12">
            <div className="md:col-span-5">
              <SectionTitle
                eyebrow="Méthode"
                title="Un chemin clair, étape par étape"
                description="Diagnostiquer, décider, mettre en œuvre, stabiliser — avec rigueur et sobriété."
              />
            </div>

            <div className="md:col-span-7">
              <ol className="space-y-4">
                {[
                  { step: "01", title: "Observer", text: "Cartographier le flux, clarifier les irritants, comprendre les contraintes." },
                  { step: "02", title: "Choisir", text: "Définir 2–3 leviers maximum : priorisation, WIP, qualité, gouvernance." },
                  { step: "03", title: "Exécuter", text: "Mettre en place des routines utiles, ajuster, renforcer l’autonomie." },
                  { step: "04", title: "Ancrer", text: "Stabiliser : standards légers, suivi, transfert et montée en compétence." },
                ].map((item) => (
                  <li
                    key={item.step}
                    className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-[0_1px_0_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900"
                  >
                    <div className="flex items-start gap-4">
                      <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 text-xs font-semibold text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200">
                        {item.step}
                      </span>
                      <div>
                        <p className="text-sm font-semibold">{item.title}</p>
                        <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                          {item.text}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </Container>
      </section>

      {/* ABOUT */}
      <section id="about" className="py-16 sm:py-20">
        <Container>
          <div className="grid gap-10 md:grid-cols-12 md:items-start">
            <div className="md:col-span-5">
              <SectionTitle
                eyebrow="À propos"
                title="Une posture de service, un cadre exigeant"
                description="Un accompagnement qui respecte les contraintes du terrain, tout en ouvrant des marges de manœuvre."
              />
            </div>
            <div className="md:col-span-7">
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-[0_1px_0_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900">
                <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                  Remplacez ce paragraphe par votre présentation : contextes, positionnement, manière
                  de travailler (cadence, livrables, posture).
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 dark:border-neutral-800 dark:bg-neutral-950">
                    <p className="text-sm font-semibold">Pragmatisme</p>
                    <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
                      Peu d’actions, un effet réel, mesurable.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 dark:border-neutral-800 dark:bg-neutral-950">
                    <p className="text-sm font-semibold">Respect</p>
                    <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
                      Le changement s’appuie sur l’existant.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <footer className="border-t border-neutral-200 py-10 dark:border-neutral-800">
        <Container>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              © {new Date().getFullYear()} Garance — Coach Lean-Agile
            </p>
            <div className="flex gap-4 text-sm text-neutral-600 dark:text-neutral-300">
              <ScrollTo targetId="home" className="hover:text-neutral-900 dark:hover:text-neutral-50">
                Haut de page
              </ScrollTo>
              <a
                href={BOOKING_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-neutral-900 dark:hover:text-neutral-50"
              >
                Prendre rendez-vous
              </a>
              <Link href="/contact" className="hover:text-neutral-900 dark:hover:text-neutral-50">
                Contact
              </Link>
            </div>
          </div>
        </Container>
      </footer>
    </main>
  );
}
