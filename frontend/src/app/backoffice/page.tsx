import { notFound } from "next/navigation";
import BackofficePageClient from "./BackofficePageClient";
import { isDemoMode } from "../lib/demo";

export default function BackofficePage() {
  if (isDemoMode()) {
    notFound();
  }

  return <BackofficePageClient />;
}
