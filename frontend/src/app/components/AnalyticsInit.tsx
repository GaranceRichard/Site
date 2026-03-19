"use client";

import { useEffect } from "react";

import { GA_MEASUREMENT_ID, initGA, isGaEnabled } from "../lib/analytics";

export default function AnalyticsInit() {
  useEffect(() => {
    if (!isGaEnabled()) {
      return;
    }

    initGA(GA_MEASUREMENT_ID);
  }, []);

  return null;
}
