import { Container, SectionTitle, DetailsAccordion } from "./ui";

export type Service = {
  title: string;
  points: readonly string[];
};

export default function ServicesSection({ services }: { services: readonly Service[] }) {
  return (
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
              {services.map((s) => (
                <DetailsAccordion key={s.title} title={s.title} points={[...s.points]} />
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
