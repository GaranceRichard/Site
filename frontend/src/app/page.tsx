// frontend/src/app/page.tsx
import TopNav from "./components/TopNav";

import FooterSection from "./components/home/FooterSection";
import { BOOKING_URL, METHOD_STEPS } from "./content";

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
    <main className="min-h-screen px-3 py-3 sm:px-4 sm:py-4">
      <div className="app-shell overflow-hidden">
        <TopNav nav={nav} bookingUrl={BOOKING_URL} />

        {HOME_SECTIONS.map((s) => (
          <div key={s.id}>
            {s.render({
              steps: METHOD_STEPS,
            })}
          </div>
        ))}

        <FooterSection bookingUrl={BOOKING_URL} />
      </div>
    </main>
  );
}
