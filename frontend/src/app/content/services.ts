// frontend/src/app/content/services.ts
export const SERVICES = [
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
] as const;

export type Service = (typeof SERVICES)[number];
