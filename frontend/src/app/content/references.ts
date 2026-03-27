// frontend/src/app/content/references.ts

export type Reference = {
  id: string;
  nameCollapsed: string;
  nameExpanded: string;
  missionTitle: string;
  label?: string;
  imageSrc: string;
  badgeSrc?: string;
  badgeAlt?: string;
  situation: string;
  tasks: string[];
  actions: string[];
  results: string[];
};

export const REFERENCES: readonly Reference[] = [
  {
    id: "les-castas",
    nameCollapsed: "Castas",
    nameExpanded: "Les Castas",
    missionTitle: "Accompagnement Lean-Agile",
    label: "Reference",
    imageSrc: "/les-castas.png",
    situation:
      "Structurer les priorites et redonner un cadre de pilotage lisible a une organisation en phase de consolidation.",
    tasks: ["Clarifier les irritants de flux et les points de decision."],
    actions: [
      "Animation d'ateliers de cadrage et mise en place d'un pilotage simple.",
      "Accompagnement des equipes sur les routines utiles et la stabilisation du delivery.",
    ],
    results: ["Lecture plus claire des priorites et execution plus sereine."],
  },
  {
    id: "biodiv-wind",
    nameCollapsed: "Biodiv-Wind",
    nameExpanded: "Biodiv-Wind",
    missionTitle: "Facilitation et alignement",
    label: "Reference",
    imageSrc: "/brand/logo.png",
    situation:
      "Creer un espace d'alignement entre parties prenantes autour d'un sujet transverse a forte sensibilite.",
    tasks: ["Preparer et faciliter des sequences d'arbitrage orientees decision."],
    actions: [
      "Conception d'ateliers decisifs et synthese des points de convergence.",
      "Formalisation d'un plan d'action lisible et soutenable dans le temps.",
    ],
    results: ["Meilleure synchronisation des acteurs et trajectoire partagee."],
    badgeSrc: "/badges/french-tech.png",
    badgeAlt: "French Tech",
  },
  {
    id: "solution30",
    nameCollapsed: "Solutions30",
    nameExpanded: "Solution30",
    missionTitle: "Stabilisation du delivery",
    label: "Reference",
    imageSrc: "/brand/logo.png",
    situation: "Rendre le flux de travail plus fiable dans un contexte de charge et de coordination elevees.",
    tasks: ["Identifier les points de friction et proposer peu de leviers a fort effet."],
    actions: [
      "Travail sur la priorisation, le rythme d'equipe et la lisibilite du travail en cours.",
    ],
    results: ["Moins de reprises, plus de visibilite et une cadence plus reguliere."],
  },
  {
    id: "fasst",
    nameCollapsed: "FASST",
    nameExpanded: "FASST",
    missionTitle: "Coaching d'equipe",
    label: "Reference",
    imageSrc: "/brand/logo.png",
    situation: "Aider une equipe a se doter d'un cadre de travail plus explicite sans surcouche organisationnelle.",
    tasks: ["Renforcer l'autonomie et la capacite a prendre des decisions utiles."],
    actions: [
      "Coaching au quotidien, clarification des roles et soutien a l'amelioration continue.",
    ],
    results: ["Equipe plus autonome et pratiques plus durables."],
  },
  {
    id: "beneva",
    nameCollapsed: "Beneva",
    nameExpanded: "Beneva",
    missionTitle: "Transformation pragmatique",
    label: "Reference",
    imageSrc: "/brand/logo.png",
    situation: "Concilier transformation, contraintes reelles de terrain et exigences de continuite d'execution.",
    tasks: ["Cadrer une progression realiste et directement utile aux equipes."],
    actions: ["Construction d'un chemin de transformation sobre, mesurable et transferable."],
    results: ["Trajectoire plus lisible et appropriation plus forte par les equipes."],
  },
  {
    id: "banque-nationale",
    nameCollapsed: "BNC",
    nameExpanded: "Banque Nationale du Canada",
    missionTitle: "Gouvernance legere et delivery",
    label: "Reference",
    imageSrc: "/brand/logo.png",
    situation: "Fluidifier les arbitrages et renforcer la qualite des decisions dans un environnement structure.",
    tasks: ["Rechercher une gouvernance legere et une execution plus fiable."],
    actions: ["Facilitation des boucles de decision et simplification du pilotage."],
    results: ["Decision plus lisible et meilleur alignement sur les priorites."],
  },
  {
    id: "messs",
    nameCollapsed: "MESS",
    nameExpanded: "Ministere de l'Emploi et de la Solidarite Sociale",
    missionTitle: "Accompagnement et amelioration continue",
    label: "Reference",
    imageSrc: "/brand/logo.png",
    situation: "Soutenir une dynamique d'amelioration continue au service d'un contexte institutionnel exigeant.",
    tasks: ["Apporter un cadre concret, transmissible et adapte aux contraintes publiques."],
    actions: ["Animation, structuration des rituels et accompagnement des equipes sur la duree."],
    results: ["Pratiques plus stables et progression plus visible dans le temps."],
  },
] as const;

export type ReferenceItem = (typeof REFERENCES)[number];
