// frontend/src/app/page.tsx
import TopNav from "./components/TopNav";

import HeroSection from "./components/home/HeroSection";
import PromiseSection from "./components/home/PromiseSection";
import ServicesSection from "./components/home/ServicesSection";
import CasesSection from "./components/home/CasesSection";
import MethodSection from "./components/home/MethodSection";
import AboutSection from "./components/home/AboutSection";
import FooterSection from "./components/home/FooterSection";

type NavItem = { label: string; href: string };

const NAV: NavItem[] = [
  { label: "Accueil", href: "#home" },
  { label: "Promesse", href: "#promise" },
  { label: "Offres", href: "#services" },
  { label: "Références", href: "#cases" },
  { label: "Méthode", href: "#method" },
  { label: "À propos", href: "#about" },
];

const BOOKING_URL = "https://calendar.app.google/hYgX38RpfWiu65Vh8";

const SERVICES = [
  {
    title: "Coaching Lean-Agile — transformation pragmatique",
    points: [
      "Cadrage : objectifs, périmètre, gouvernance légère",
      "Coaching d’équipes : rituels, flux, qualité, amélioration continue",
      "Accompagnement des leaders : posture, décision, pilotage",
    ],
  },
  {
    title: "Facilitation — ateliers décisifs et alignement",
    points: [
      "Ateliers d’alignement (vision, priorités, arbitrages)",
      "Résolution structurée de problèmes (A3, 5 Why, etc.)",
      "Conception de parcours d’ateliers (du diagnostic à l’action)",
    ],
  },
  {
    title: "Formation — bases solides, ancrage durable",
    points: [
      "Lean / Agile : fondamentaux, pratiques, anti-patterns",
      "Pilotage par la valeur : priorisation, métriques, flow",
      "Transfert : supports, exercices, plan d’ancrage",
    ],
  },
];

const CASES = [
  {
    title: "Réduction du délai de livraison",
    tag: "Flow & qualité",
    description:
      "Pilotage simple du flux (WIP, limites, revues), stabilisation de la qualité et clarification des priorités.",
  },
  {
    title: "Alignement multi-équipes",
    tag: "Gouvernance légère",
    description:
      "Ateliers d’alignement, clarification des dépendances, rituels inter-équipes et règles de décision — sans surcharger l’organisation.",
  },
  {
    title: "Montée en autonomie des équipes",
    tag: "Coaching",
    description:
      "Renforcement de la posture, amélioration continue, responsabilisation progressive sur la planification et la livraison.",
  },
];

const METHOD_STEPS = [
  {
    step: "01",
    title: "Observer",
    text: "Cartographier le flux, clarifier les irritants, comprendre les contraintes.",
  },
  {
    step: "02",
    title: "Choisir",
    text: "Définir 2–3 leviers maximum : priorisation, WIP, qualité, gouvernance.",
  },
  {
    step: "03",
    title: "Exécuter",
    text: "Mettre en place des routines utiles, ajuster, renforcer l’autonomie.",
  },
  {
    step: "04",
    title: "Ancrer",
    text: "Stabiliser : standards légers, suivi, transfert et montée en compétence.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-50">
      <TopNav nav={NAV} bookingUrl={BOOKING_URL} />

      <HeroSection />
      <PromiseSection />
      <ServicesSection services={SERVICES} />
      <CasesSection cases={CASES} />
      <MethodSection steps={METHOD_STEPS} />
      <AboutSection />
      <FooterSection bookingUrl={BOOKING_URL} />
    </main>
  );
}
