import Link from "next/link";

import { withBasePath } from "../lib/demo";
import { fetchMetadataHeader } from "../lib/siteMetadata";

type NavItem = {
  href: string;
  label: string;
};

const DEFAULT_NAV: NavItem[] = [
  { href: "/", label: "Accueil" },
  { href: "/publications", label: "Publications" },
  { href: "/references", label: "References" },
  { href: "/contact", label: "Contact" },
];

export default async function ContentPageHeader({
  currentPath,
  nav = DEFAULT_NAV,
}: {
  currentPath: string;
  nav?: NavItem[];
}) {
  const header = await fetchMetadataHeader();

  return (
    <header className="sticky top-0 z-50 border-b subtle-divider bg-[color:var(--surface)]/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-5 py-4 sm:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3 text-left">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={withBasePath("/brand/logo.png")}
            alt={header.name}
            className="h-12 w-12 object-contain"
          />
          <div className="min-w-0 leading-tight">
            <p className="text-sm font-semibold">{header.name}</p>
            <p className="text-xs [color:var(--text-muted)]">{header.title}</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {nav.map((item) => {
            const isActive = currentPath === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "ui-pill inline-flex items-center justify-center px-3 py-2 text-sm font-semibold",
                  isActive ? "border-[color:var(--border-strong)] text-[color:var(--text-primary)]" : "",
                ].join(" ")}
                aria-current={isActive ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
