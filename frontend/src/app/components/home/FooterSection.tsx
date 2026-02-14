"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import ScrollTo from "../ScrollTo";
import { Container } from "./ui";
import AuthLoginButton from "../auth/LoginButton";
import {
  getHeaderSettings,
  getHeaderSettingsServer,
  subscribeHeaderSettings,
} from "../../content/headerSettings";

export default function FooterSection({ bookingUrl }: { bookingUrl: string }) {
  const headerSettings = useSyncExternalStore(
    subscribeHeaderSettings,
    getHeaderSettings,
    getHeaderSettingsServer,
  );
  const bookingHref = headerSettings.bookingUrl || bookingUrl;

  return (
    <footer className="border-t border-neutral-200 dark:border-neutral-800">
      <Container>
        <div className="flex h-[72px] items-center justify-between">
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            (c) {new Date().getFullYear()} {headerSettings.name} - {headerSettings.title}
          </p>

          <div className="flex flex-wrap items-center justify-end gap-4 text-sm text-neutral-600 dark:text-neutral-300">
            <ScrollTo
              targetId="home"
              className="hover:text-neutral-900 dark:hover:text-neutral-50"
            >
              Haut de page
            </ScrollTo>

            <a
              href={bookingHref}
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

            <AuthLoginButton size={70} className="ml-1" />
          </div>
        </div>
      </Container>
    </footer>
  );
}
