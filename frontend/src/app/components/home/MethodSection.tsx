import { Container, SectionTitle } from "./ui";

export type MethodStep = {
  step: string;
  title: string;
  text: string;
};

export default function MethodSection({ steps }: { steps: readonly MethodStep[] }) {
  return (
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
              {steps.map((item) => (
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
  );
}
