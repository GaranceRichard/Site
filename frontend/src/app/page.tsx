// frontend/src/app/page.tsx
import TopNav from "./components/TopNav";

import FooterSection from "./components/home/FooterSection";
import { BOOKING_URL, METHOD_STEPS, SERVICES } from "./content";

import {
  HOME_SECTIONS,
  type NavItem,
} from "./content/homeSections";

export default function HomePage() {
  const nav: NavItem[] = HOME_SECTIONS.map((s) => ({
    label: s.label,
    href: `#${s.id}`,
  }));

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50">
      <TopNav nav={nav} bookingUrl={BOOKING_URL} />

      {HOME_SECTIONS.map((s) => (
        <div key={s.id}>
          {s.render({
            services: SERVICES,
            steps: METHOD_STEPS,
          })}
        </div>
      ))}

      <FooterSection bookingUrl={BOOKING_URL} />
    </main>
  );
}
