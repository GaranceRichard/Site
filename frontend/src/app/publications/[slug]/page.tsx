import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import ContentPageHeader from "../../components/ContentPageHeader";
import FooterSection from "../../components/home/FooterSection";
import SiteSettingsProvider from "../../components/SiteSettingsProvider";
import {
  Container,
  ELEVATED_PANEL_CLASS,
  MUTED_PANEL_CLASS,
  PANEL_CLASS,
  cx,
} from "../../components/home/ui";
import { BOOKING_URL } from "../../content";
import {
  getPublicationPageEntryBySlug,
  getPublicationsPageEntries,
} from "../../lib/siteContent";
import { fetchPublicSiteSettings } from "../../lib/publicSiteSettings";
import { buildMetadataTitle, fetchMetadataHeader } from "../../lib/siteMetadata";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const items = await getPublicationsPageEntries();
  return items.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const [header, item] = await Promise.all([
    fetchMetadataHeader(),
    getPublicationPageEntryBySlug(slug),
  ]);

  if (!item) {
    return {};
  }

  return {
    title: `${item.title} | ${buildMetadataTitle(header)}`,
    description: item.excerpt,
  };
}

export default async function PublicationDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const [initialSettings, item, allItems] = await Promise.all([
    fetchPublicSiteSettings(),
    getPublicationPageEntryBySlug(slug),
    getPublicationsPageEntries(),
  ]);

  if (!item) {
    notFound();
  }

  const relatedItems = allItems.filter((entry) => entry.slug !== item.slug).slice(0, 2);

  return (
    <main className="min-h-screen px-3 py-3 sm:px-4 sm:py-4">
      <SiteSettingsProvider initialSettings={initialSettings}>
        <div className="app-shell overflow-hidden">
          <ContentPageHeader currentPath="/publications" />

        <section className="border-b subtle-divider py-16 sm:py-20">
          <Container>
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr),320px]">
              <article className={cx(ELEVATED_PANEL_CLASS, "space-y-6")}>
                <div className="space-y-4">
                  <p className="eyebrow">Publication</p>
                  <h1 className="section-title text-[2.2rem] sm:text-[2.8rem]">{item.title}</h1>
                  <p className="text-sm leading-7 [color:var(--text-secondary)]">{item.excerpt}</p>
                </div>

                <div
                  className={cx(
                    PANEL_CLASS,
                    "whitespace-pre-line text-sm leading-8 [color:var(--text-secondary)]",
                  )}
                >
                  {item.content}
                </div>

                {item.links && item.links.length > 0 ? (
                  <div className={cx(MUTED_PANEL_CLASS, "space-y-3")}>
                    <p className="eyebrow">Liens associes</p>
                    <div className="flex flex-col gap-3">
                      {item.links.map((link) => (
                        <a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-semibold underline underline-offset-4"
                        >
                          {link.title}
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}
              </article>

              <aside className="space-y-4">
                <div className={cx(MUTED_PANEL_CLASS, "space-y-3")}>
                  <p className="eyebrow">Navigation</p>
                  <Link href="/publications" className="primary-button w-full justify-center px-4 py-2 text-sm">
                    Toutes les publications
                  </Link>
                  <Link href="/references" className="secondary-button w-full justify-center px-4 py-2 text-sm">
                    Voir les references
                  </Link>
                </div>

                {relatedItems.length > 0 ? (
                  <div className={cx(PANEL_CLASS, "space-y-3")}>
                    <p className="eyebrow">Autres publications</p>
                    {relatedItems.map((relatedItem) => (
                      <Link
                        key={relatedItem.slug}
                        href={`/publications/${relatedItem.slug}`}
                        className="block text-sm font-semibold [color:var(--text-primary)] hover:[color:var(--text-secondary)]"
                      >
                        {relatedItem.title}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </aside>
            </div>
          </Container>
        </section>

          <FooterSection bookingUrl={BOOKING_URL} />
        </div>
      </SiteSettingsProvider>
    </main>
  );
}
