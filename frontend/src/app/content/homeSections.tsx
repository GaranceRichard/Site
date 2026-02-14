import type React from "react";

import HeroSection from "../components/home/HeroSection";
import PromiseSection from "../components/home/PromiseSection";
import AboutSection from "../components/home/AboutSection";
import ServicesSection from "../components/home/ServicesSection";
import MethodSection from "../components/home/MethodSection";
import ReferencesSection from "../components/home/ReferencesSection";


import type { Service, MethodStep } from "./index";

export type NavItem = { label: string; href: string };

type RenderCtx = {
  services: readonly Service[];
  steps: readonly MethodStep[];
};

export type HomeSectionDef = {
  id: string;
  label: string;
  render: (ctx: RenderCtx) => React.ReactElement;
};

// Ordre : home, promise, method, services, references, about
export const HOME_SECTIONS: HomeSectionDef[] = [
  { id: "home", label: "Accueil", render: () => <HeroSection /> },
  { id: "promise", label: "Positionnement", render: () => <PromiseSection /> },
  { id: "method", label: "Approche", render: ({ steps }) => <MethodSection steps={steps} /> },
  { id: "services", label: "Publications", render: ({ services }) => <ServicesSection services={services} /> },
  { id: "references", label: "Références", render: () => <ReferencesSection /> },
  { id: "about", label: "À propos", render: () => <AboutSection /> },
];
