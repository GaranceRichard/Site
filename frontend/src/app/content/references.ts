// frontend/src/app/content/references.ts

export type Reference = {
  id: string;

  // Affichages
  nameCollapsed: string; // petit
  nameExpanded: string; // grand
  missionTitle: string; // sous le nom étendu
  label?: string;

  // Média
  imageSrc: string; // image/visuel

  // Badge optionnel (ex: French Tech)
  badgeSrc?: string;
  badgeAlt?: string;

  // Détail (modale)
  situation: string; // contexte
  tasks: string[]; // mission
  actions: string[]; // actions
  results: string[]; // résultats
};

export const REFERENCES: readonly Reference[] = [
  {
    id: "les-castas",
    nameCollapsed: "Castas",
    nameExpanded: "Les Castas",
    missionTitle: "Accompagnement Lean-Agile",
    label: "Référence",
    imageSrc: "/references/les-castas.png",
    situation: "Contexte à compléter.",
    tasks: ["Mission à compléter."],
    actions: ["Actions à compléter."],
    results: ["Résultats à compléter."],
  },
  {
    id: "biodiv-wind",
    nameCollapsed: "Biodiv-Wind",
    nameExpanded: "Biodiv-Wind",
    missionTitle: "Facilitation & alignement",
    label: "Référence",
    imageSrc: "/references/biodiv-wind.webp",
    situation: "Contexte à compléter.",
    tasks: ["Mission à compléter."],
    actions: ["Actions à compléter."],
    results: ["Résultats à compléter."],
    badgeSrc: "/badges/french-tech.png",
    badgeAlt: "French Tech",
  },
  {
    id: "solution30",
    nameCollapsed: "Solutions30",
    nameExpanded: "Solution30",
    missionTitle: "Stabilisation du delivery",
    label: "Référence",
    imageSrc: "/references/solutions30.jpg",
    situation: "Contexte à compléter.",
    tasks: ["Mission à compléter."],
    actions: ["Actions à compléter."],
    results: ["Résultats à compléter."],
  },
  {
    id: "fasst",
    nameCollapsed: "FASST",
    nameExpanded: "FASST",
    missionTitle: "Coaching d’équipe",
    label: "Référence",
    imageSrc: "/references/fasst.png",
    situation: "Contexte à compléter.",
    tasks: ["Mission à compléter."],
    actions: ["Actions à compléter."],
    results: ["Résultats à compléter."],
  },
  {
    id: "beneva",
    nameCollapsed: "Beneva",
    nameExpanded: "Beneva",
    missionTitle: "Transformation pragmatique",
    label: "Référence",
    imageSrc: "/references/beneva.png",
    situation: "Contexte à compléter.",
    tasks: ["Mission à compléter."],
    actions: ["Actions à compléter."],
    results: ["Résultats à compléter."],
  },
  {
    id: "banque-nationale",
    nameCollapsed: "BNC",
    nameExpanded: "Banque Nationale du Canada",
    missionTitle: "Gouvernance légère & delivery",
    label: "Référence",
    imageSrc: "/references/banque-nationale.png",
    situation: "Contexte à compléter.",
    tasks: ["Mission à compléter."],
    actions: ["Actions à compléter."],
    results: ["Résultats à compléter."],
  },
  {
    id: "messs",
    nameCollapsed: "MESS",
    nameExpanded: "Ministère de l'Emploi et de la Solidarité Sociale",
    missionTitle: "Accompagnement & amélioration continue",
    label: "Référence",
    imageSrc: "/references/messs.png",
    situation: "Contexte à compléter.",
    tasks: ["Mission à compléter."],
    actions: ["Actions à compléter."],
    results: ["Résultats à compléter."],
  },
] as const;

export type ReferenceItem = (typeof REFERENCES)[number];
