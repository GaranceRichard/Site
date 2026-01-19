// frontend/src/app/components/home/FooterSection.tsx
"use client";

import Link from "next/link";
import ScrollTo from "../ScrollTo";
import { Container } from "./ui";
import AuthLoginButton from "../auth/LoginButton";

export default function FooterSection({ bookingUrl }: { bookingUrl: string }) {
  return (
    <footer className="border-t border-neutral-200 dark:border-neutral-800">
      <Container>
        <div className="flex h-[72px] items-center justify-between">
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            © {new Date().getFullYear()} Garance — Coach Lean-Agile
          </p>

          {/* Liens footer */}
          <div className="flex flex-wrap items-center justify-end gap-4 text-sm text-neutral-600 dark:text-neutral-300">
            <ScrollTo
              targetId="home"
              className="hover:text-neutral-900 dark:hover:text-neutral-50"
            >
              Haut de page
            </ScrollTo>

            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-neutral-900 dark:hover:text-neutral-50"
            >
              Prendre rendez-vous
            </a>

            <Link
              href="/contact"
              className="hover:text-neutral-900 dark:hover:text-neutral-50"
            >
              Contact
            </Link>

            {/* Icône back-office — même taille que le logo du header */}
            <AuthLoginButton size={70} className="ml-1" />
          </div>
        </div>
      </Container>
    </footer>
  );
}
