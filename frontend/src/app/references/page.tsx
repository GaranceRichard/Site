import Link from "next/link";
import type { Metadata } from "next";

import ContentPageHeader from "../components/ContentPageHeader";
import FooterSection from "../components/home/FooterSection";
import SiteSettingsProvider from "../components/SiteSettingsProvider";
import { Container, ELEVATED_PANEL_CLASS, MUTED_PANEL_CLASS, cx } from "../components/home/ui";
import { BOOKING_URL } from "../content";
import { isDemoMode, toDemoAssetUrl } from "../lib/demo";
import { toProxiedMediaUrl } from "../lib/media";
import { fetchPublicSiteSettings } from "../lib/publicSiteSettings";
import { getReferencePageEntries } from "../lib/siteContent";
import { buildMetadataTitle, fetchMetadataHeader } from "../lib/siteMetadata";

export async function generateMetadata(): Promise<Metadata> {
  const header = await fetchMetadataHeader();
  const siteTitle = buildMetadataTitle(header);

  return {
    title: `References | ${siteTitle}`,
    description:
      "References detaillees : contexte, role assume, actions menees et resultats observables.",
  };
}

export default async function ReferencesPage() {
  const [initialSettings, items] = await Promise.all([
    fetchPublicSiteSettings(),
    getReferencePageEntries(),
  ]);
  const demoMode = isDemoMode();

  return (
    <main className="min-h-screen px-3 py-3 sm:px-4 sm:py-4">
      <SiteSettingsProvider initialSettings={initialSettings}>
        <div className="app-shell overflow-hidden">
          <ContentPageHeader currentPath="/references" />

        <section className="border-b subtle-divider py-16 sm:py-20">
          <Container>
            <div className="max-w-3xl">
              <p className="eyebrow">References</p>
              <h1 className="section-title mt-4 text-[2.4rem] sm:text-[3rem]">
                Contextes, role assume et resultats visibles
              </h1>
              <p className="section-copy mt-4">
                Des pages dediees pour documenter chaque intervention avec un niveau de detail
                utile au SEO, au partage et a la lecture.
              </p>
            </div>

            <div className="mt-10 grid gap-4 lg:grid-cols-2">
              {items.map((item) => {
                const imageSrc = item.image;
                const resolvedImage = imageSrc
                  ? demoMode
                    ? toDemoAssetUrl(imageSrc)
                    : toProxiedMediaUrl(imageSrc)
                  : "";

                return (
                  <article key={item.slug} className={cx(ELEVATED_PANEL_CLASS, "space-y-4")}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="eyebrow">Reference</p>
                        <h2 className="mt-3 text-xl font-semibold">{item.reference}</h2>
                      </div>
                      {resolvedImage ? (
                        <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={resolvedImage} alt="" className="h-full w-full object-cover" />
                        </div>
                      ) : null}
                    </div>

                    <p className="text-sm font-medium [color:var(--text-primary)]">
                      {item.results?.[0] || item.situation}
                    </p>
                    <p className="text-sm leading-7 [color:var(--text-secondary)]">{item.excerpt}</p>

                    <div className={cx(MUTED_PANEL_CLASS, "space-y-3")}>
                      <p className="eyebrow">En bref</p>
                      <ul className="list-disc space-y-2 pl-5 text-sm leading-7 [color:var(--text-secondary)]">
                        {item.tasks.slice(0, 2).map((task) => (
                          <li key={task}>{task}</li>
                        ))}
                      </ul>
                    </div>

                    <Link href={`/references/${item.slug}`} className="primary-button px-4 py-2 text-sm">
                      Voir la reference
                    </Link>
                  </article>
                );
              })}
            </div>
          </Container>
        </section>

          <FooterSection bookingUrl={BOOKING_URL} />
        </div>
      </SiteSettingsProvider>
    </main>
  );
}
