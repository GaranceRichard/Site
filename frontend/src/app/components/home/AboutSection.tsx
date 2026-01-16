// frontend/src/app/components/home/AboutSection.tsx
import { Container, SectionTitle } from "./ui";

export default function AboutSection() {
  return (
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
  );
}
