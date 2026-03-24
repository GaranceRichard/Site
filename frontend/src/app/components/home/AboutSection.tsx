"use client";

import { useSyncExternalStore } from "react";
import {
  getAboutSettings,
  getAboutSettingsServer,
  subscribeAboutSettings,
} from "../../content/aboutSettings";
import { Container, SectionTitle } from "./ui";

export default function AboutSection() {
  const settings = useSyncExternalStore(
    subscribeAboutSettings,
    getAboutSettings,
    getAboutSettingsServer,
  );

  return (
    <section id="about" className="py-16 sm:py-20">
      <Container>
        <div className="grid gap-10 md:grid-cols-12 md:items-start">
          <div className="md:col-span-5">
            <SectionTitle eyebrow="A propos" title={settings.title} description={settings.subtitle} />
          </div>

          <div className="md:col-span-7">
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-[0_1px_0_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900">
              <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                {settings.highlight.intro}
              </p>

              {settings.highlight.items.length > 0 ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {settings.highlight.items.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 dark:border-neutral-800 dark:bg-neutral-950"
                    >
                      <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
