import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import AnalyticsInit from "./components/AnalyticsInit";
import FlashToast from "./components/FlashToast";
import SentryInit from "./components/SentryInit";
import { withBasePath } from "./lib/demo";
import {
  DEFAULT_METADATA_DESCRIPTION,
  DEFAULT_METADATA_KEYWORDS,
  DEFAULT_OPEN_GRAPH_DESCRIPTION,
  DEFAULT_TWITTER_DESCRIPTION,
  buildMetadataTitle,
  fetchMetadataHeader,
} from "./lib/siteMetadata";

export async function generateMetadata(): Promise<Metadata> {
  const header = await fetchMetadataHeader();
  const siteTitle = buildMetadataTitle(header);

  return {
    title: {
      default: siteTitle,
      template: `%s | ${header.name}`,
    },
    description: DEFAULT_METADATA_DESCRIPTION,
    keywords: DEFAULT_METADATA_KEYWORDS,
    openGraph: {
      title: siteTitle,
      description: DEFAULT_OPEN_GRAPH_DESCRIPTION,
      type: "website",
      locale: "fr_CA",
    },
    twitter: {
      card: "summary_large_image",
      title: siteTitle,
      description: DEFAULT_TWITTER_DESCRIPTION,
    },
    icons: {
      icon: withBasePath("/brand/logo.png"),
    },
  };
}

export default function RootLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <SentryInit />
        <AnalyticsInit />
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  try {
    var stored = localStorage.getItem("theme");
    var theme = stored === "light" || stored === "dark"
      ?stored
      : (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ?"dark" : "light");
    document.documentElement.classList.toggle("dark", theme === "dark");
  } catch (e) {}
})();
            `,
          }}
        />
        {children}
        {modal}
        <FlashToast />
      </body>
    </html>
  );
}
