// frontend/src/app/components/home/PromiseSection.tsx
import { Container, SectionTitle } from "./ui";

export default function PromiseSection() {
  return (
    <section id="promise" className="py-16 sm:py-20">
      <Container>
        <div className="grid gap-10 md:grid-cols-12 md:items-start">
          <div className="md:col-span-5">
            <SectionTitle
              eyebrow="Positionnement"
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
  );
}
