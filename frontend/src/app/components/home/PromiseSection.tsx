"use client";

import { useSyncExternalStore } from "react";
import {
  getPromiseSettings,
  getPromiseSettingsServer,
  subscribePromiseSettings,
} from "../../content/promiseSettings";
import { Container, SectionTitle } from "./ui";

export default function PromiseSection() {
  const promise = useSyncExternalStore(
    subscribePromiseSettings,
    getPromiseSettings,
    getPromiseSettingsServer,
  );

  return (
    <section id="promise" className="py-16 sm:py-20">
      <Container>
        <div className="grid gap-10 md:grid-cols-12 md:items-start">
          <div className="md:col-span-5">
            <SectionTitle
              eyebrow="Positionnement"
              title={promise.title}
              description={promise.subtitle}
            />
          </div>

          <div className="md:col-span-7">
            <div className="grid gap-4 sm:grid-cols-2">
              {promise.cards.map((card) => (
                <div
                  key={card.id}
                  className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-[0_1px_0_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <p className="text-sm font-semibold">{card.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                    {card.content}
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
