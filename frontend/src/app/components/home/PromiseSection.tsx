"use client";

import { useSyncExternalStore } from "react";
import {
  getPromiseSettings,
  getPromiseSettingsServer,
  subscribePromiseSettings,
} from "../../content/promiseSettings";
import { Container, ELEVATED_PANEL_CLASS, PANEL_CLASS, SectionTitle, cx } from "./ui";

export default function PromiseSection() {
  const promise = useSyncExternalStore(
    subscribePromiseSettings,
    getPromiseSettings,
    getPromiseSettingsServer,
  );

  return (
    <section id="promise" className="border-b subtle-divider py-16 sm:py-20">
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
              {promise.cards.map((card, index) => (
                <div key={card.id} className={cx(index === 0 ? ELEVATED_PANEL_CLASS : PANEL_CLASS, "h-full")}>
                  <p className="eyebrow">Promesse</p>
                  <p className="mt-3 text-base font-semibold">{card.title}</p>
                  <p className="mt-3 text-sm leading-relaxed [color:var(--text-secondary)]">
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
