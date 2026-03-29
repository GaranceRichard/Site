import Link from "next/link";
import type { Metadata } from "next";

import ContentPageHeader from "../components/ContentPageHeader";
import FooterSection from "../components/home/FooterSection";
import SiteSettingsProvider from "../components/SiteSettingsProvider";
import {
  Container,
  ELEVATED_PANEL_CLASS,
  MUTED_PANEL_CLASS,
  cx,
} from "../components/home/ui";
import { BOOKING_URL } from "../content";
import {
  getPublicationPageSettings,
  getPublicationsPageEntries,
} from "../lib/siteContent";
import { fetchPublicSiteSettings } from "../lib/publicSiteSettings";
import { buildMetadataTitle, fetchMetadataHeader } from "../lib/siteMetadata";

export async function generateMetadata(): Promise<Metadata> {
  const header = await fetchMetadataHeader();
  const siteTitle = buildMetadataTitle(header);

  return {
    title: `Publications | ${siteTitle}`,
    description:
      "Analyses sur le delivery, les arbitrages, la priorisation et la capacite a livrer dans des contextes exigeants.",
  };
}

export default async function PublicationsPage() {
  const [initialSettings, settings, items] = await Promise.all([
    fetchPublicSiteSettings(),
    getPublicationPageSettings(),
    getPublicationsPageEntries(),
  ]);

  return (
    <main className="min-h-screen px-3 py-3 sm:px-4 sm:py-4">
      <SiteSettingsProvider initialSettings={initialSettings}>
        <div className="app-shell overflow-hidden">
          <ContentPageHeader currentPath="/publications" />

        <section className="border-b subtle-divider py-16 sm:py-20">
          <Container>
            <div className="grid gap-10 md:grid-cols-12">
              <div className="md:col-span-4">
                <p className="eyebrow">Publications</p>
                <h1 className="section-title mt-4 text-[2.4rem] sm:text-[3rem]">{settings.title}</h1>
                <p className="section-copy mt-4">{settings.subtitle}</p>
                <div className={cx(MUTED_PANEL_CLASS, "mt-6")}>
                  <p className="eyebrow">Repere editorial</p>
                  <p className="mt-3 whitespace-pre-line text-sm leading-7 [color:var(--text-secondary)]">
                    {settings.highlight.content}
                  </p>
                </div>
              </div>

              <div className="md:col-span-8">
                <div className="grid gap-4">
                  {items.map((item) => (
                    <article key={item.slug} className={cx(ELEVATED_PANEL_CLASS, "space-y-4")}>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="eyebrow">Publication</p>
                          <h2 className="mt-3 text-xl font-semibold">{item.title}</h2>
                        </div>
                        <span className="ui-pill px-3 py-2 text-xs font-semibold">Article</span>
                      </div>

                      <p className="text-sm leading-7 [color:var(--text-secondary)]">{item.excerpt}</p>

                      <div className="flex flex-wrap items-center gap-3">
                        <Link href={`/publications/${item.slug}`} className="primary-button px-4 py-2 text-sm">
                          Lire la publication
                        </Link>
                        {item.links?.[0] ? (
                          <a
                            href={item.links[0].url}
                            target="_blank"
                            rel="noreferrer"
                            className="secondary-button px-4 py-2 text-sm"
                          >
                            {item.links[0].title}
                          </a>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </Container>
        </section>

          <FooterSection bookingUrl={BOOKING_URL} />
        </div>
      </SiteSettingsProvider>
    </main>
  );
}
