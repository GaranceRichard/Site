"use client";

import Link from "next/link";
import ScrollTo from "../ScrollTo";
import { Container } from "./ui";
import AuthLoginButton from "../auth/LoginButton";

export default function FooterSection({ bookingUrl }: { bookingUrl: string }) {
  return (
    <footer className="border-t border-neutral-200 py-10 dark:border-neutral-800">
      <Container>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            © {new Date().getFullYear()} Garance — Coach Lean-Agile
          </p>

          {/* Liens footer */}
          <div className="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-300">
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

            {/* Icône back-office — APRÈS Contact */}
            <AuthLoginButton size={80} className="ml-1" />
          </div>
        </div>
      </Container>
    </footer>
  );
}
