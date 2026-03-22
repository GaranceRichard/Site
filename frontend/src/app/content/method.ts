export const METHOD_STEPS = [
  {
    step: "01",
    title: "Observer",
    text: "Cartographier le flux, clarifier les irritants, comprendre les contraintes.",
  },
  {
    step: "02",
    title: "Choisir",
    text: "Definir 2-3 leviers maximum : priorisation, WIP, qualite, gouvernance.",
  },
  {
    step: "03",
    title: "Executer",
    text: "Mettre en place des routines utiles, ajuster, renforcer l autonomie.",
  },
  {
    step: "04",
    title: "Ancrer",
    text: "Stabiliser : standards legers, suivi, transfert et montee en competence.",
  },
] as const;

export type MethodStep = (typeof METHOD_STEPS)[number];
