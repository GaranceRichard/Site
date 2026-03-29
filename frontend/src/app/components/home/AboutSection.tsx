"use client";

import { useSyncExternalStore } from "react";
import { useInitialSiteSettings } from "../SiteSettingsProvider";
import {
  getAboutSettings,
  getAboutSettingsServer,
  subscribeAboutSettings,
} from "../../content/aboutSettings";
import { Container, MUTED_PANEL_CLASS, PANEL_CLASS, SectionTitle, cx } from "./ui";

export default function AboutSection() {
  const initialSettings = useInitialSiteSettings();
  const settings = useSyncExternalStore(
    subscribeAboutSettings,
    getAboutSettings,
    () => initialSettings?.about ?? getAboutSettingsServer(),
  );

  return (
    <section id="about" className="py-16 sm:py-20">
      <Container>
        <div className="grid gap-10 md:grid-cols-12 md:items-start">
          <div className="md:col-span-5">
            <SectionTitle eyebrow="A propos" title={settings.title} description={settings.subtitle} />
          </div>

          <div className="md:col-span-7">
            <div className={PANEL_CLASS}>
              <p className="text-sm leading-relaxed [color:var(--text-secondary)]">
                {settings.highlight.intro}
              </p>

              {settings.highlight.items.length > 0 ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {settings.highlight.items.map((item) => (
                    <div key={item.id} className={cx(MUTED_PANEL_CLASS, "px-4 py-4")}>
                      <p className="text-sm font-medium [color:var(--text-secondary)]">{item.text}</p>
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
