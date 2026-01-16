// frontend/src/app/components/home/CasesSection.tsx
import { Container, SectionTitle, CaseCard } from "./ui";

type CaseItem = {
  title: string;
  tag: string;
  description: string;
};

export default function CasesSection({ cases }: { cases: CaseItem[] }) {
  return (
    <section id="cases" className="py-16 sm:py-20">
      <Container>
        <SectionTitle
          eyebrow="Références"
          title="Exemples d’impact"
          description="Sans promesses vagues : des résultats observables, soutenus par un cadre simple."
        />

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {cases.map((c) => (
            <CaseCard key={c.title} title={c.title} tag={c.tag} description={c.description} />
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600 shadow-[0_1px_0_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
          <span className="font-semibold text-neutral-900 dark:text-neutral-50">Option :</span>{" "}
          intégrer ici des “preuves” (avant/après, métriques, verbatims), en gardant la même sobriété.
        </div>
      </Container>
    </section>
  );
}
