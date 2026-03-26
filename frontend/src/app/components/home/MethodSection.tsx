import { Container, PANEL_CLASS, SectionTitle, cx } from "./ui";

export type MethodStep = {
  step: string;
  title: string;
  text: string;
};

export default function MethodSection({ steps }: { steps: readonly MethodStep[] }) {
  return (
    <section id="method" className="border-b subtle-divider py-16 sm:py-20">
      <Container>
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <SectionTitle
              eyebrow="Approche"
              title="Un chemin clair, etape par etape"
              description="Diagnostiquer, decider, mettre en oeuvre, stabiliser - avec rigueur et sobriete."
            />
          </div>

          <div className="md:col-span-7">
            <ol className="space-y-4">
              {steps.map((item) => (
                <li key={item.step} className={cx(PANEL_CLASS, "relative overflow-hidden")}>
                  <div className="absolute inset-y-0 left-0 w-px bg-[color:var(--border-strong)]" />
                  <div className="flex items-start gap-4">
                    <span className="ui-pill mt-0.5 inline-flex h-9 w-9 items-center justify-center text-xs font-semibold">
                      {item.step}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="mt-2 text-sm leading-relaxed [color:var(--text-secondary)]">
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
