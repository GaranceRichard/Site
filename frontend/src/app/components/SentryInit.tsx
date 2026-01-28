// frontend/src/app/components/SentryInit.tsx
"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/browser";

let initialized = false;

export default function SentryInit() {
  useEffect(() => {
    if (initialized) return;
    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
    if (!dsn) return;

    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,
    });

    initialized = true;
  }, []);

  return null;
}
