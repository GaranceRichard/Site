import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import FlashToast from "./components/FlashToast";
import SentryInit from "./components/SentryInit";

export const metadata: Metadata = {
  title: {
    default: "Garance Richard | Coach Lean-Agile",
    template: "%s | Garance Richard",
  },
  description:
    "Accompagnement Lean-Agile pragmatique pour clarifier les priorités, stabiliser le flux et renforcer l'autonomie des équipes.",
  keywords: [
    "coach lean agile",
    "transformation agile",
    "accompagnement équipes",
    "optimisation flux",
    "garance richard",
  ],
  openGraph: {
    title: "Garance Richard | Coach Lean-Agile",
    description:
      "Des équipes plus sereines, des livraisons plus fiables. Accompagnement orienté résultats.",
    type: "website",
    locale: "fr_CA",
  },
  twitter: {
    card: "summary_large_image",
    title: "Garance Richard | Coach Lean-Agile",
    description:
      "Accompagnement Lean-Agile pragmatique pour clarifier la priorité et stabiliser le flux.",
  },
  icons: {
    icon: "/brand/logo.png",
  },
};

export default function RootLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        <SentryInit />
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

        {/* Notification légère globale */}
        <FlashToast />
      </body>
    </html>
  );
}
