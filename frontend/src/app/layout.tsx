import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import FlashToast from "./components/FlashToast";

export const metadata: Metadata = {
  title: "Mon site",
  description: "Coach Lean/Agile",
  icons: {
    icon: [
      { url: "/brand/logo-16.png", sizes: "16x16", type: "image/png" },
      { url: "/brand/logo-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/logo-48.png", sizes: "48x48", type: "image/png" },
      { url: "/brand/logo-64.png", sizes: "64x64", type: "image/png" },
    ],
    apple: "/brand/logo-180.png",
  },
  manifest: "/brand/site.webmanifest",
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
