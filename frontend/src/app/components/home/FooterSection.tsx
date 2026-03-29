"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";

import ScrollTo from "../ScrollTo";
import { useInitialSiteSettings } from "../SiteSettingsProvider";
import AuthLoginButton from "../auth/LoginButton";
import {
  getHeaderSettings,
  getHeaderSettingsServer,
  subscribeHeaderSettings,
} from "../../content/headerSettings";
import { ANALYTICS_EVENTS, trackEvent } from "../../lib/analytics";
import { isDemoMode } from "../../lib/demo";
import { Container, PRIMARY_BUTTON_CLASS, SECONDARY_BUTTON_CLASS, cx } from "./ui";

export default function FooterSection({ bookingUrl }: { bookingUrl: string }) {
  const demoMode = isDemoMode();
  const initialSettings = useInitialSiteSettings();
  const headerSettings = useSyncExternalStore(
    subscribeHeaderSettings,
    getHeaderSettings,
    () => initialSettings?.header ?? getHeaderSettingsServer(),
  );
  const bookingHref = headerSettings.bookingUrl || bookingUrl;

  return (
    <footer id={demoMode ? undefined : "contact"} className="border-t subtle-divider">
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

            {!demoMode ? (
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
            ) : null}

            <AuthLoginButton size={70} className="ml-1" />
          </div>
        </div>
      </Container>
    </footer>
  );
}
