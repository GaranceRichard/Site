"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import ScrollTo from "../ScrollTo";
import { ANALYTICS_EVENTS, trackEvent } from "../../lib/analytics";
import { Container, PRIMARY_BUTTON_CLASS, SECONDARY_BUTTON_CLASS, cx } from "./ui";
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
    <footer id="contact" className="border-t subtle-divider">
      <Container>
        <div className="flex min-h-[88px] flex-col justify-between gap-5 py-6 md:flex-row md:items-center">
          <p className="text-sm [color:var(--text-secondary)]">
            (c) {new Date().getFullYear()} {headerSettings.name} - {headerSettings.title}
          </p>

          <div className="flex flex-wrap items-center justify-end gap-3 text-sm [color:var(--text-secondary)]">
            <ScrollTo targetId="home" className={cx(SECONDARY_BUTTON_CLASS, "px-4 py-2")}>
              Haut de page
            </ScrollTo>

            <a
              href={bookingHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackEvent(ANALYTICS_EVENTS.CTA_CLICK, {
                  cta_label: "echanger",
                  cta_location: "footer",
                })
              }
              className={cx(PRIMARY_BUTTON_CLASS, "px-4 py-2")}
            >
              Échanger
            </a>

            <Link
              href="/contact"
              onClick={() =>
                trackEvent(ANALYTICS_EVENTS.CTA_CLICK, {
                  cta_label: "contact",
                  cta_location: "footer",
                })
              }
              className={cx(SECONDARY_BUTTON_CLASS, "px-4 py-2")}
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
