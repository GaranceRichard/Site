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
import { isDemoMode, toDemoAssetUrl } from "../../lib/demo";
import { toProxiedMediaUrl } from "../../lib/media";
import { fetchPublicSiteSettings } from "../../lib/publicSiteSettings";
import {
  getReferencePageEntries,
  getReferencePageEntryBySlug,
} from "../../lib/siteContent";
import { buildMetadataTitle, fetchMetadataHeader } from "../../lib/siteMetadata";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const items = await getReferencePageEntries();
  return items.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const [header, item] = await Promise.all([
    fetchMetadataHeader(),
    getReferencePageEntryBySlug(slug),
  ]);

  if (!item) {
    return {};
  }

  return {
    title: `${item.reference} | ${buildMetadataTitle(header)}`,
    description: item.excerpt,
  };
}

export default async function ReferenceDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const [initialSettings, item, allItems] = await Promise.all([
    fetchPublicSiteSettings(),
    getReferencePageEntryBySlug(slug),
    getReferencePageEntries(),
  ]);

  if (!item) {
    notFound();
  }

  const relatedItems = allItems.filter((entry) => entry.slug !== item.slug).slice(0, 3);
  const demoMode = isDemoMode();
  const imageSrc = item.image_thumb?.trim() ? item.image_thumb : item.image;
  const resolvedImage = imageSrc
    ? demoMode
      ? toDemoAssetUrl(imageSrc)
      : toProxiedMediaUrl(imageSrc)
    : "";

  return (
    <main className="min-h-screen px-3 py-3 sm:px-4 sm:py-4">
      <SiteSettingsProvider initialSettings={initialSettings}>
        <div className="app-shell overflow-hidden">
          <ContentPageHeader currentPath="/references" />

        <section className="border-b subtle-divider py-16 sm:py-20">
          <Container>
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr),320px]">
              <article className={cx(ELEVATED_PANEL_CLASS, "space-y-6")}>
                <div className="space-y-4">
                  <p className="eyebrow">Reference</p>
                  <h1 className="section-title text-[2.2rem] sm:text-[2.8rem]">{item.reference}</h1>
                  <p className="text-sm font-medium [color:var(--text-primary)]">
                    {item.results?.[0] || "Intervention documentee"}
                  </p>
                </div>

                {resolvedImage ? (
                  <div className="relative overflow-hidden rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface-muted)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={resolvedImage} alt="" className="h-auto w-full object-cover" />
                  </div>
                ) : null}

                <div className={cx(PANEL_CLASS, "space-y-4")}>
                  <p className="eyebrow">Contexte</p>
                  <p className="text-sm leading-8 [color:var(--text-secondary)]">{item.situation}</p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className={cx(MUTED_PANEL_CLASS, "space-y-3")}>
                    <p className="eyebrow">Taches</p>
                    <ul className="list-disc space-y-2 pl-5 text-sm leading-7 [color:var(--text-secondary)]">
                      {item.tasks.map((task) => (
                        <li key={task}>{task}</li>
                      ))}
                    </ul>
                  </div>
                  <div className={cx(MUTED_PANEL_CLASS, "space-y-3")}>
                    <p className="eyebrow">Actions</p>
                    <ul className="list-disc space-y-2 pl-5 text-sm leading-7 [color:var(--text-secondary)]">
                      {item.actions.map((action) => (
                        <li key={action}>{action}</li>
                      ))}
                    </ul>
                  </div>
                  <div className={cx(MUTED_PANEL_CLASS, "space-y-3")}>
                    <p className="eyebrow">Resultats</p>
                    <ul className="list-disc space-y-2 pl-5 text-sm leading-7 [color:var(--text-secondary)]">
                      {item.results.map((result) => (
                        <li key={result}>{result}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>

              <aside className="space-y-4">
                <div className={cx(MUTED_PANEL_CLASS, "space-y-3")}>
                  <p className="eyebrow">Navigation</p>
                  <Link href="/references" className="primary-button w-full justify-center px-4 py-2 text-sm">
                    Toutes les references
                  </Link>
                  <Link href="/publications" className="secondary-button w-full justify-center px-4 py-2 text-sm">
                    Voir les publications
                  </Link>
                </div>

                {relatedItems.length > 0 ? (
                  <div className={cx(PANEL_CLASS, "space-y-3")}>
                    <p className="eyebrow">Autres references</p>
                    {relatedItems.map((relatedItem) => (
                      <Link
                        key={relatedItem.slug}
                        href={`/references/${relatedItem.slug}`}
                        className="block text-sm font-semibold [color:var(--text-primary)] hover:[color:var(--text-secondary)]"
                      >
                        {relatedItem.reference}
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
