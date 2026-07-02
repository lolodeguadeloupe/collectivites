export type CouleurPalier = "rouge" | "orange" | "jaune" | "vert";
export type CodePalier =
  | "critique"
  | "fragile"
  | "enProgression"
  | "solide";

export type Palier = {
  min: number;
  max: number;
  code: CodePalier;
  libelle: string;
  couleur: CouleurPalier;
};

export type QuestionType =
  | "oui_non"
  | "echelle_1_4"
  | "choix_unique"
  | "choix_multiple";

export type Option = {
  valeur: string;
  libelle: string;
  points: number;
};

export type PredicatSi = string | string[];

export type GraviteAlerte = "rouge" | "orange";

export type AlerteDefinition = {
  si: PredicatSi;
  libelle: string;
  gravite: GraviteAlerte;
};

export type PrioriteAction = "URGENT" | "COURT_TERME" | "MOYEN_TERME";
export type EffortAction = "FAIBLE" | "MOYEN" | "ELEVE";

export type ActionDefinition = {
  si: PredicatSi;
  libelle: string;
  priorite: PrioriteAction;
  effort: EffortAction;
  budgetMin?: number;
  budgetMax?: number;
  ressourceUrl?: string;
};

export type Question = {
  id: string;
  libelle: string;
  aide: string;
  type: QuestionType;
  pointsMax: number;
  options: Option[];
  alertes?: AlerteDefinition[];
  actions?: ActionDefinition[];
};

export type Domaine = {
  id: string;
  libelle: string;
  poids: number;
  questions: Question[];
};

export type Bareme = {
  version: string;
  paliers: Palier[];
  domaines: Domaine[];
};

// ---- Runtime / response types ---------------------------------------------

export type ReponseValeur = string | string[];

export type Reponse = {
  questionId: string;
  valeur: ReponseValeur;
};

export type ScoreDomaine = {
  domaineId: string;
  pourcentage: number; // 0..100
  pointsObtenus: number;
  pointsMax: number;
  nbQuestionsRepondues: number;
};

export type ScoreGlobal = {
  pourcentage: number; // 0..100
  parDomaine: ScoreDomaine[];
  palier: Palier;
};

export type AlerteDetectee = {
  questionId: string;
  domaineId: string;
  libelle: string;
  gravite: GraviteAlerte;
};

export type ActionGeneree = {
  questionId: string;
  domaineId: string;
  libelle: string;
  priorite: PrioriteAction;
  effort: EffortAction;
  budgetMin?: number;
  budgetMax?: number;
  ressourceUrl?: string;
};
