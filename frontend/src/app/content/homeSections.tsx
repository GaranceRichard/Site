import type React from "react";

import HeroSection from "../components/home/HeroSection";
import PromiseSection from "../components/home/PromiseSection";
import AboutSection from "../components/home/AboutSection";
import ServicesSection from "../components/home/ServicesSection";
import MethodSection from "../components/home/MethodSection";
import CasesSection from "../components/home/CasesSection";

import type { Service, CaseItem, MethodStep } from "./index";

export type NavItem = { label: string; href: string };

type RenderCtx = {
  services: readonly Service[];
  cases: readonly CaseItem[];
  steps: readonly MethodStep[];
};

export type HomeSectionDef = {
  id: string;
  label: string;
  render: (ctx: RenderCtx) => React.ReactElement;
};

// Ordre : home, promise, about, services, method, cases
export const HOME_SECTIONS: HomeSectionDef[] = [
  { id: "home", label: "Accueil", render: () => <HeroSection /> },
  { id: "promise", label: "Promesse", render: () => <PromiseSection /> },
  { id: "about", label: "À propos", render: () => <AboutSection /> },
  {
    id: "services",
    label: "Offres",
    render: ({ services }) => <ServicesSection services={services} />,
  },
  {
    id: "method",
    label: "Méthode",
    render: ({ steps }) => <MethodSection steps={steps} />,
  },
  {
    id: "cases",
    label: "Références",
    render: ({ cases }) => <CasesSection cases={cases} />,
  },
];
