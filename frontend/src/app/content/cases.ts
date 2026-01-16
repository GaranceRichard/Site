// frontend/src/app/content/cases.ts
export const CASES = [
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
] as const;

export type CaseItem = (typeof CASES)[number];
