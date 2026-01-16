// frontend/src/app/content/method.ts
export const METHOD_STEPS = [
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
] as const;

export type MethodStep = (typeof METHOD_STEPS)[number];
