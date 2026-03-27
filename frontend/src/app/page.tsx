// frontend/src/app/page.tsx
import TopNav from "./components/TopNav";
import DemoNotice from "./components/DemoNotice";

import AboutSection from "./components/home/AboutSection";
import FooterSection from "./components/home/FooterSection";
import HeroSection from "./components/home/HeroSection";
import MethodSection from "./components/home/MethodSection";
import PromiseSection from "./components/home/PromiseSection";
import ReferencesSection from "./components/home/ReferencesSection";
import ServicesSection from "./components/home/ServicesSection";
import { BOOKING_URL } from "./content";

import { HOME_NAV_ITEMS } from "./content/homeSections";

export default function HomePage() {
  return (
    <main className="min-h-screen px-3 py-3 sm:px-4 sm:py-4">
      <div className="app-shell overflow-hidden">
        <DemoNotice />
        <TopNav nav={HOME_NAV_ITEMS} bookingUrl={BOOKING_URL} />

        <HeroSection />
        <PromiseSection />
        <MethodSection />
        <ServicesSection />
        <ReferencesSection />
        <AboutSection />

        <FooterSection bookingUrl={BOOKING_URL} />
      </div>
    </main>
  );
}
