// frontend/src/app/contact/page.tsx
import { notFound } from "next/navigation";
import HomePage from "../page";
import { isDemoMode } from "../lib/demo";

export default function ContactPage() {
  if (isDemoMode()) {
    notFound();
  }

  return <HomePage />;
}
